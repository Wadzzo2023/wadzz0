import "server-only";

import { Asset, Keypair, Operation, TransactionBuilder, type Transaction } from "@stellar/stellar-sdk";
import { ItemPrivacy, type Platform } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import { StellarAccount, toAsset, type AssetRef } from "~/lib/stellar/account";
import {
  BASE_RESERVE_XLM,
  PLATFORM_ASSET,
  PLATFORM_FEE,
  PLATFORM_FEE_XLM,
  TX_TIMEOUT_SECONDS,
  TrxBaseFee,
  TrxBaseFeeInPlatformAsset,
  networkPassphrase,
} from "~/lib/stellar/constant";
import type { BuyMethod, CostLine, Problem, Quote } from "~/lib/stellar/quote";
import type { Db } from "~/server/db";
import { inPlatformScope } from "~/server/platform-scope";

import { issuerKeypairFor, motherKeypair, platformStorageKeypair, signForUser, type Signer } from "./keys";
import { platformToUsd, platformToXlm, xlmToPlatform } from "./prices";

type Ctx = { db: Db; platform: Pick<Platform, "id" | "isRoot"> };

const amt = (n: number) => (Math.round(n * 1e7) / 1e7).toFixed(7);
const round = (n: number, dp: number) => Math.round(n * 10 ** dp) / 10 ** dp;
const sum = (lines: CostLine[]) => lines.filter((l) => l.inTotal).reduce((s, l) => s + l.amount, 0);

/* ───────────────────────────── listing context ───────────────────────────── */

async function loadListing(ctx: Ctx, listingId: number) {
  const listing = await ctx.db.marketAsset.findUnique({
    where: { id: listingId },
    include: {
      asset: {
        include: {
          tier: { select: { id: true, name: true, price: true } },
          creator: { select: { id: true, name: true, pageAsset: { select: { code: true, issuer: true } }, customPageAssetCodeIssuer: true } },
        },
      },
      placer: { select: { id: true, storagePub: true } },
    },
  });
  if (!listing || !inPlatformScope(ctx, listing.platformId)) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });

  const { asset } = listing;
  // No placer = a platform (admin) listing sold from the platform's storage.
  const sellerId = listing.placerId ?? motherKeypair().publicKey();
  const stockAccount = listing.placer?.storagePub ?? platformStorageKeypair().publicKey();
  const isOriginal = !listing.placerId || listing.placerId === asset.creatorId;
  const royaltyPercent = !isOriginal && asset.creatorId ? Math.min(Math.max(asset.royaltyPercent, 0), 100) : 0;

  return { listing, asset, sellerId, stockAccount, isOriginal, royaltyPercent };
}
type Listing = Awaited<ReturnType<typeof loadListing>>;

/** The creator's page token (followers hold it; tiers need an amount of it). */
function pageAssetOf(l: Listing): AssetRef | null {
  const c = l.asset.creator;
  if (c?.pageAsset) return c.pageAsset;
  const [code, issuer] = c?.customPageAssetCodeIssuer?.split("-") ?? [];
  return code && issuer?.length === 56 ? { code, issuer } : null;
}

/** Copies held in PENDING (unexpired) transactions: minted ones count against supply, the rest against stock. */
async function pendingFor(db: Db, assetId: number, listingId: number) {
  const rows = await db.assetTransaction.findMany({
    where: { assetId, status: "PENDING", expiresAt: { gt: new Date() } },
    select: { minted: true, quantity: true, marketAssetId: true },
  });
  return {
    minting: rows.reduce((s, r) => s + r.minted, 0),
    fromStock: rows.filter((r) => r.marketAssetId === listingId).reduce((s, r) => s + (r.quantity - r.minted), 0),
  };
}

/**
 * Where the next copy comes from and how many are left: stock in the seller's
 * storage first; for the creator's own listing, then minting on demand up to
 * the asset's limit (only while someone can sign for the issuer).
 */
async function availability(ctx: Ctx, l: Listing) {
  const storage = await StellarAccount.load(l.stockAccount);
  const pending = await pendingFor(ctx.db, l.asset.id, l.listing.id);
  const stock = Math.max(0, Math.floor((storage?.tokenBalance(l.asset.code, l.asset.issuer) ?? 0) - pending.fromStock));

  let mintable = 0;
  let issuer: Keypair | null = null;
  if (l.isOriginal) {
    issuer = await issuerKeypairFor(ctx.db, l.asset);
    if (issuer) {
      mintable = l.asset.limit == null ? Infinity : Math.max(0, l.asset.limit - l.asset.mintedCount - pending.minting);
      if (mintable > 0 && !(await StellarAccount.load(issuer.publicKey()))) mintable = 0; // issuer not on-chain yet
    }
  }
  const total = stock + mintable;
  return {
    source: (stock > 0 ? "stock" : "mint") as "stock" | "mint",
    copiesLeft: total === Infinity ? null : total,
    available: total > 0,
    issuer,
    storageSecretNeeded: stock > 0,
  };
}

/* ──────────────────────────────── access ──────────────────────────────── */

function accessProblem(l: Listing, buyer: StellarAccount | null): Problem | null {
  const privacy = l.listing.privacy;
  if (privacy === ItemPrivacy.DRAFT || privacy === ItemPrivacy.NOT_FOR_SALE) {
    return { code: "NOT_FOR_SALE", message: "This item isn't for sale right now." };
  }
  // Resales are open to everyone; the creator's access rules apply to their own listing.
  if (!l.isOriginal || privacy === ItemPrivacy.PUBLIC || privacy === ItemPrivacy.FOR_SALE) return null;

  const page = pageAssetOf(l);
  const name = l.asset.creator?.name ?? "the creator";
  if (privacy === ItemPrivacy.PRIVATE) {
    if (page && buyer?.hasTrustline(page.code, page.issuer)) return null;
    return { code: "NO_ACCESS", message: `Only followers of ${name} can buy this. Follow them first.`, action: "follow" };
  }
  if (privacy === ItemPrivacy.TIER && l.asset.tier) {
    if (page && buyer && buyer.tokenBalance(page.code, page.issuer) >= l.asset.tier.price) return null;
    return {
      code: "NO_ACCESS",
      message: `Only ${l.asset.tier.name} members of ${name} can buy this (hold ${l.asset.tier.price} ${page?.code ?? "page tokens"}).`,
      action: "join_tier",
    };
  }
  return null;
}

/* ──────────────────────────────── quote ──────────────────────────────── */

type Plan = {
  quote: Quote;
  l: Listing;
  buyer: StellarAccount | null;
  /** who pays the network fee and provides the sequence number */
  feeSource: "buyer" | "mother";
  avail: Awaited<ReturnType<typeof availability>>;
  /** amounts in the currency each operation moves */
  pay: { seller: number; royalty: number; platform: number; currencyAsset: Asset };
};

/** Operations in the transaction, for the network-fee estimate. */
function opCount(method: BuyMethod, needsTrust: boolean, royalty: boolean, sellerIsMother: boolean) {
  let n = 1; // delivery
  if (needsTrust) n += method === "XLM" ? 1 : 2; // (XLM top-up) + changeTrust
  if (method !== "CARD") n += 1; // fee bundle to the platform
  if (!sellerIsMother) n += 1; // seller payout
  if (royalty) n += 1;
  return n;
}

async function plan(ctx: Ctx, buyerId: string, listingId: number, method: BuyMethod): Promise<Plan> {
  const l = await loadListing(ctx, listingId);
  const [buyer, avail] = await Promise.all([StellarAccount.load(buyerId), availability(ctx, l)]);
  const problems: Problem[] = [];
  const code = PLATFORM_ASSET.code;

  if (l.sellerId === buyerId) problems.push({ code: "OWN_LISTING", message: "This is your own listing." });
  const access = accessProblem(l, buyer);
  if (access) problems.push(access);
  if (!avail.available) problems.push({ code: "SOLD_OUT", message: "Sold out — no copies left." });
  if (!buyer) problems.push({ code: "ACCOUNT_INACTIVE", message: "Your wallet isn't active on Stellar yet. Add some XLM to activate it." });

  const needsTrust = !buyer?.hasTrustline(l.asset.code, l.asset.issuer);
  if (needsTrust && buyer && !buyer.canAddSubentries(1)) {
    problems.push({ code: "TOO_MANY_ASSETS", message: "Your wallet holds the maximum number of different assets (1000). Remove one first." });
  }

  const sellerIsMother = l.sellerId === motherKeypair().publicKey();
  const hasRoyalty = l.royaltyPercent > 0;
  const ops = opCount(method, needsTrust, hasRoyalty, sellerIsMother);
  const networkFeeXlm = (ops * Number(TrxBaseFee)) / 1e7;
  // XLM buyers pay the network fee themselves. Token buyers do too when they hold
  // a little XLM; otherwise the platform fronts it (charged in tokens below).
  // Card purchases are sent by the platform so the buyer often signs nothing.
  const feeSource: "buyer" | "mother" =
    method === "XLM" ? "buyer" : method === "CARD" ? "mother" : buyer && buyer.spendableXlm() >= networkFeeXlm ? "buyer" : "mother";

  const lines: CostLine[] = [];
  let currency = code;
  let balance: number | null = null;
  let pay: Plan["pay"];
  const price = l.listing.price;
  const royaltyOf = (p: number, dp: number) => round((p * l.royaltyPercent) / 100, dp);

  try {
    if (method === "PLATFORM_ASSET") {
      const royalty = royaltyOf(price, 7);
      const reserve = needsTrust ? await xlmToPlatform(BASE_RESERVE_XLM) : 0;
      const platformFee = Number(PLATFORM_FEE);
      lines.push({ key: "price", label: "Price", amount: price, currency, inTotal: true });
      if (royalty) lines.push({ key: "royalty", label: `Creator royalty (${l.royaltyPercent}%, included)`, amount: royalty, currency, inTotal: false });
      lines.push({ key: "platformFee", label: "Platform fee", amount: platformFee, currency, inTotal: true });
      if (feeSource === "mother") {
        lines.push({ key: "networkFee", label: "Network fee", amount: Number(TrxBaseFeeInPlatformAsset), currency, inTotal: true });
      } else {
        lines.push({ key: "networkFee", label: "Network fee", amount: networkFeeXlm, currency: "XLM", hint: "Paid in XLM from your wallet", inTotal: false });
      }
      if (reserve) {
        lines.push({ key: "reserve", label: "Wallet reserve for this item", amount: reserve, currency, hint: "Stellar locks 0.5 XLM per new item; covered once", inTotal: true });
      }
      balance = buyer?.platformBalance() ?? 0;
      pay = { seller: round(price - royalty, 7), royalty, platform: sum(lines) - price, currencyAsset: PLATFORM_ASSET };
      if (buyer && !buyer.trustsPlatformAsset()) {
        problems.push({ code: "NO_PLATFORM_TRUST", message: `Your wallet doesn't hold ${code} yet. Get some ${code} first.`, action: "recharge" });
      }
    } else if (method === "XLM") {
      currency = "XLM";
      const priceXlm = await platformToXlm(price);
      const royalty = royaltyOf(priceXlm, 7);
      lines.push({ key: "price", label: "Price", amount: priceXlm, currency, inTotal: true });
      if (royalty) lines.push({ key: "royalty", label: `Creator royalty (${l.royaltyPercent}%, included)`, amount: royalty, currency, inTotal: false });
      lines.push({ key: "platformFee", label: "Platform fee", amount: PLATFORM_FEE_XLM, currency, inTotal: true });
      lines.push({ key: "networkFee", label: "Network fee", amount: networkFeeXlm, currency, inTotal: true });
      if (needsTrust) {
        lines.push({ key: "reserve", label: "Wallet reserve for this item", amount: BASE_RESERVE_XLM, currency, hint: "Stays in your wallet; returned if you remove the item", inTotal: true });
      }
      balance = buyer?.spendableXlm() ?? 0;
      pay = { seller: round(priceXlm - royalty, 7), royalty, platform: PLATFORM_FEE_XLM, currencyAsset: Asset.native() };
    } else {
      currency = "USD";
      const priceUsd = l.listing.priceUSD;
      const royaltyPlatform = royaltyOf(price, 7);
      const platformFee = await platformToUsd(Number(PLATFORM_FEE) + Number(TrxBaseFeeInPlatformAsset));
      const reserve = needsTrust ? await platformToUsd(await xlmToPlatform(BASE_RESERVE_XLM)) : 0;
      lines.push({ key: "price", label: "Price", amount: priceUsd, currency, inTotal: true });
      if (royaltyPlatform) lines.push({ key: "royalty", label: `Creator royalty (${l.royaltyPercent}%, included)`, amount: round((priceUsd * l.royaltyPercent) / 100, 2), currency, inTotal: false });
      lines.push({ key: "platformFee", label: "Platform & network fee", amount: platformFee, currency, inTotal: true });
      if (reserve) lines.push({ key: "reserve", label: "Wallet reserve for this item", amount: reserve, currency, hint: "Stellar locks 0.5 XLM per new item", inTotal: true });
      // Card buyers pay USD; the platform pays the seller the listed token price.
      pay = { seller: round(price - royaltyPlatform, 7), royalty: royaltyPlatform, platform: 0, currencyAsset: PLATFORM_ASSET };
    }
  } catch {
    problems.push({ code: "PRICE_UNAVAILABLE", message: "Couldn't load exchange rates. Try again in a moment." });
    pay = { seller: 0, royalty: 0, platform: 0, currencyAsset: PLATFORM_ASSET };
  }

  const total = round(sum(lines), currency === "XLM" ? 7 : 2);
  if (balance !== null && buyer && !problems.some((p) => p.code === "NO_PLATFORM_TRUST") && balance < total) {
    problems.push({
      code: method === "XLM" ? "INSUFFICIENT_XLM" : "INSUFFICIENT_FUNDS",
      message: `You need ${round(total - balance, currency === "XLM" ? 7 : 2)} more ${currency} (balance ${round(balance, 4)}, total ${total}).`,
      action: "recharge",
    });
  }
  if (method === "PLATFORM_ASSET" && feeSource === "buyer" && buyer && buyer.spendableXlm() < networkFeeXlm) {
    problems.push({ code: "INSUFFICIENT_XLM", message: "You need a little XLM for the network fee.", action: "recharge" });
  }

  await checkReceivers(l, method, pay, problems);
  await checkPlatform(method, needsTrust, feeSource, problems);

  return {
    l,
    buyer,
    feeSource,
    avail,
    pay,
    quote: {
      method,
      currency,
      lines,
      total,
      balance,
      source: avail.source,
      copiesLeft: avail.copiesLeft,
      needsTrustline: needsTrust,
      payout: { seller: pay.seller, royalty: pay.royalty, currency: method === "XLM" ? "XLM" : code },
      ok: problems.length === 0,
      problems,
    },
  };
}

/** The seller and the creator must be able to receive what they're paid. */
async function checkReceivers(l: Listing, method: BuyMethod, pay: Plan["pay"], problems: Problem[]) {
  const mother = motherKeypair().publicKey();
  const receivers = [
    { id: l.sellerId, who: "The seller", amount: pay.seller },
    ...(pay.royalty > 0 && l.asset.creatorId ? [{ id: l.asset.creatorId, who: "The creator", amount: pay.royalty }] : []),
  ].filter((r) => r.id !== mother && r.amount > 0);
  for (const r of receivers) {
    const acc = await StellarAccount.load(r.id);
    const ok = acc && (method === "XLM" || acc.trustsPlatformAsset());
    if (!ok) {
      problems.push({
        code: "SELLER_CANNOT_RECEIVE",
        message: `${r.who}'s wallet can't receive ${method === "XLM" ? "XLM" : PLATFORM_ASSET.code} payments right now. Try another payment method or come back later.`,
      });
      return;
    }
  }
}

/** The platform account must be able to front what it fronts (reserve top-up, fees, card payouts). */
async function checkPlatform(method: BuyMethod, needsTrust: boolean, feeSource: "buyer" | "mother", problems: Problem[]) {
  const fronts = (needsTrust && method !== "XLM") || feeSource === "mother";
  if (!fronts) return;
  const mother = await StellarAccount.load(motherKeypair().publicKey());
  if (!mother || mother.spendableXlm() < BASE_RESERVE_XLM + 1) {
    problems.push({ code: "PLATFORM_UNAVAILABLE", message: "Purchases are paused for a moment. Please try again shortly." });
  }
}

/** Preflight only: will a purchase go through, and exactly what will it cost. */
export async function quotePurchase(ctx: Ctx, buyerId: string, listingId: number, method: BuyMethod) {
  return (await plan(ctx, buyerId, listingId, method)).quote;
}

/* ──────────────────────────────── build ──────────────────────────────── */

async function buildTransaction(ctx: Ctx, p: Plan, buyerId: string, signer: Signer) {
  const { l, quote, pay } = p;
  const method = quote.method;
  const mother = motherKeypair();
  const asset = toAsset(l.asset);
  const source = p.feeSource === "buyer" ? p.buyer!.raw : (await StellarAccount.loadOrThrow(mother.publicKey(), "Platform account")).raw;

  const tx = new TransactionBuilder(source, { fee: TrxBaseFee, networkPassphrase }).setTimeout(TX_TIMEOUT_SECONDS);
  const motherPub = mother.publicKey();
  const fromBuyer = method !== "CARD";
  const payer = fromBuyer ? buyerId : motherPub;

  // 1. Payments: platform fee bundle, seller, creator royalty.
  if (fromBuyer && pay.platform > 0) {
    tx.addOperation(Operation.payment({ source: buyerId, destination: motherPub, asset: pay.currencyAsset, amount: amt(pay.platform) }));
  }
  if (pay.seller > 0 && l.sellerId !== payer) {
    tx.addOperation(Operation.payment({ source: payer, destination: l.sellerId, asset: pay.currencyAsset, amount: amt(pay.seller) }));
  }
  if (pay.royalty > 0 && l.asset.creatorId) {
    tx.addOperation(Operation.payment({ source: payer, destination: l.asset.creatorId, asset: pay.currencyAsset, amount: amt(pay.royalty) }));
  }

  // 2. Trustline (the platform tops up the reserve unless the buyer pays in XLM).
  if (quote.needsTrustline) {
    if (method !== "XLM") {
      tx.addOperation(Operation.payment({ source: motherPub, destination: buyerId, asset: Asset.native(), amount: amt(BASE_RESERVE_XLM) }));
    }
    tx.addOperation(Operation.changeTrust({ source: buyerId, asset }));
  }

  // 3. Delivery: from stock, or minted by the issuer straight to the buyer.
  const signers: Keypair[] = [];
  let minted = 0;
  if (quote.source === "stock") {
    const storage = await stockKeypair(ctx, l);
    tx.addOperation(Operation.payment({ source: storage.publicKey(), destination: buyerId, asset, amount: amt(1) }));
    signers.push(storage);
  } else {
    if (!p.avail.issuer) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This item can't be minted right now." });
    tx.addOperation(Operation.payment({ source: p.avail.issuer.publicKey(), destination: buyerId, asset, amount: amt(1) }));
    signers.push(p.avail.issuer);
    minted = 1;
  }

  const built = tx.build();
  const needsMother = built.operations.some((op) => op.source === motherPub) || p.feeSource === "mother";
  if (needsMother) signers.push(mother);
  built.sign(...signers);

  // Card purchases where the buyer has nothing to sign go out without them.
  const buyerMustSign = fromBuyer || quote.needsTrustline || p.feeSource === "buyer";
  const xdr = buyerMustSign ? await signForUser(built.toXDR(), signer) : built.toXDR();
  return { xdr, hash: built.hash().toString("hex"), minted, buyerMustSign, expiresAt: txExpiry(built) };
}

async function stockKeypair(ctx: Ctx, l: Listing) {
  if (!l.listing.placerId) return platformStorageKeypair();
  const c = await ctx.db.creator.findUnique({ where: { id: l.listing.placerId }, select: { storageSecret: true } });
  if (!c?.storageSecret) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The seller's storage is unavailable." });
  return Keypair.fromSecret(c.storageSecret);
}

function txExpiry(tx: Transaction) {
  const max = Number(tx.timeBounds?.maxTime ?? 0);
  return new Date((max || Math.floor(Date.now() / 1000) + TX_TIMEOUT_SECONDS) * 1000);
}

/**
 * Re-checks everything, then builds the transaction and records it as PENDING
 * (holding the copy until it expires). The supply check runs under a row lock
 * on the asset, so two buyers can't both get the last mintable copy.
 */
export async function preparePurchase(
  ctx: Ctx,
  {
    buyerId,
    listingId,
    method,
    signer,
    paymentRef,
    reuseTxId,
  }: { buyerId: string; listingId: number; method: BuyMethod; signer: Signer; paymentRef?: string; reuseTxId?: string },
) {
  return ctx.db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Asset" WHERE id = (SELECT "assetId" FROM "MarketAsset" WHERE id = ${listingId}) FOR UPDATE`;
      const inner = { ...ctx, db: tx as unknown as Db };
      const p = await plan(inner, buyerId, listingId, method);
      if (!p.quote.ok) return { ok: false as const, quote: p.quote };

      const built = await buildTransaction(inner, p, buyerId, signer);
      if (reuseTxId) {
        // A paid card purchase whose earlier transaction expired: same row, new transaction.
        await tx.assetTransaction.update({
          where: { id: reuseTxId },
          data: { status: "PENDING", error: null, txHash: built.hash, expiresAt: built.expiresAt, minted: built.minted },
        });
        return { ok: true as const, quote: p.quote, txId: reuseTxId, xdr: built.xdr, buyerMustSign: built.buyerMustSign };
      }
      const row = await tx.assetTransaction.create({
        data: {
          type: p.l.isOriginal ? "PURCHASE" : "RESALE_PURCHASE",
          assetId: p.l.asset.id,
          marketAssetId: listingId,
          quantity: 1,
          minted: built.minted,
          buyerId,
          sellerId: p.l.listing.placerId,
          creatorId: p.l.asset.creatorId,
          method,
          currency: p.quote.currency,
          ...amounts(p.quote),
          txHash: built.hash,
          expiresAt: built.expiresAt,
          paymentRef,
          platformId: ctx.platform.id,
        },
      });
      return { ok: true as const, quote: p.quote, txId: row.id, xdr: built.xdr, buyerMustSign: built.buyerMustSign };
    },
    { timeout: 30_000 },
  );
}

/** The ledger's money columns from a quote's lines. */
export function amounts(q: Quote) {
  const get = (k: CostLine["key"]) => q.lines.filter((l) => l.key === k && l.currency === q.currency).reduce((s, l) => s + l.amount, 0);
  return {
    price: get("price"),
    royaltyAmount: get("royalty"),
    platformFee: get("platformFee"),
    networkFee: get("networkFee"),
    reserveCost: get("reserve"),
    total: q.total,
  };
}
