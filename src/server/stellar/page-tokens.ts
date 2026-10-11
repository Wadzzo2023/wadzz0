import "server-only";

import { Asset, Keypair, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import type { Platform } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import { StellarAccount } from "~/lib/stellar/account";
import { BASE_RESERVE_XLM, PLATFORM_ASSET, TX_TIMEOUT_SECONDS, TrxBaseFee, TrxBaseFeeInPlatformAsset, networkPassphrase } from "~/lib/stellar/constant";
import type { CostLine, Problem } from "~/lib/stellar/quote";
import { pageAssetRef } from "~/server/access";
import type { Db } from "~/server/db";

import { motherKeypair, signForUser, type Signer } from "./keys";
import { xlmToPlatform } from "./prices";

type Ctx = { db: Db; platform: Pick<Platform, "id" | "isRoot"> };
export type PagePayIn = "PLATFORM_ASSET" | "XLM";
const amt = (n: number) => (Math.round(n * 1e7) / 1e7).toFixed(7);

async function load(ctx: Ctx, saleId: number) {
  const sale = await ctx.db.sellPageAsset.findUnique({
    where: { id: saleId },
    include: { placer: { select: { id: true, name: true, storagePub: true, platformId: true, approved: true, pageAsset: { select: { code: true, issuer: true } }, customPageAssetCodeIssuer: true } } },
  });
  const page = sale?.placer ? pageAssetRef(sale.placer) : null;
  if (!sale?.placer || !page || sale.isSold || sale.placer.approved !== true) throw new TRPCError({ code: "NOT_FOUND", message: "This offer isn't available." });
  return { sale, creator: sale.placer, page };
}

/**
 * A creator's page-token pack: N tokens for a price, sent from the creator's
 * storage. The buyer pays the price (to the creator's storage, as before) and
 * any reserve/network cost the platform fronts.
 */
async function plan(ctx: Ctx, buyerId: string, saleId: number, payIn: PagePayIn) {
  const { sale, creator, page } = await load(ctx, saleId);
  const problems: Problem[] = [];
  const [buyer, storage] = await Promise.all([StellarAccount.load(buyerId), StellarAccount.load(creator.storagePub)]);
  if (creator.id === buyerId) problems.push({ code: "OWN_LISTING", message: "These are your own page tokens." });
  if (!buyer) problems.push({ code: "ACCOUNT_INACTIVE", message: "Your wallet isn't active on Stellar yet." });
  if ((storage?.tokenBalance(page.code, page.issuer) ?? 0) < sale.amountToSell) problems.push({ code: "SOLD_OUT", message: "The creator has run out of tokens for this offer." });
  const needsTrust = !buyer?.hasTrustline(page.code, page.issuer);
  const networkXlm = (3 * Number(TrxBaseFee)) / 1e7;
  const feeSource = payIn === "XLM" || (buyer && buyer.spendableXlm() >= networkXlm) ? "buyer" : "mother";

  const currency = payIn === "XLM" ? "XLM" : PLATFORM_ASSET.code;
  const price = payIn === "XLM" ? sale.priceXLM : sale.price;
  const lines: CostLine[] = [{ key: "price", label: `${sale.amountToSell} ${page.code}`, amount: price, currency, inTotal: true }];
  let platformCost = 0;
  if (payIn === "XLM") {
    lines.push({ key: "networkFee", label: "Network fee", amount: networkXlm, currency, inTotal: true });
    if (needsTrust) lines.push({ key: "reserve", label: "Wallet reserve for this token", amount: BASE_RESERVE_XLM, currency, hint: "Stays in your wallet", inTotal: true });
  } else {
    if (feeSource === "mother") lines.push({ key: "networkFee", label: "Network fee", amount: Number(TrxBaseFeeInPlatformAsset), currency, inTotal: true });
    else lines.push({ key: "networkFee", label: "Network fee", amount: networkXlm, currency: "XLM", hint: "Paid in XLM from your wallet", inTotal: false });
    if (needsTrust) lines.push({ key: "reserve", label: "Wallet reserve for this token", amount: await xlmToPlatform(BASE_RESERVE_XLM), currency, inTotal: true });
    platformCost = lines.filter((l) => l.inTotal && l.key !== "price").reduce((s, l) => s + l.amount, 0);
    if (buyer && !buyer.trustsPlatformAsset()) problems.push({ code: "NO_PLATFORM_TRUST", message: `Get some ${PLATFORM_ASSET.code} first.`, action: "recharge" });
  }
  if (price <= 0) problems.push({ code: "NOT_FOR_SALE", message: `This offer can't be paid in ${currency}.` });
  const total = Math.round(lines.filter((l) => l.inTotal).reduce((s, l) => s + l.amount, 0) * 1e7) / 1e7;
  const balance = buyer ? (payIn === "XLM" ? buyer.spendableXlm() : buyer.platformBalance()) : 0;
  if (buyer && !problems.length && balance < total) problems.push({ code: payIn === "XLM" ? "INSUFFICIENT_XLM" : "INSUFFICIENT_FUNDS", message: `You need ${total} ${currency} (you have ${Math.round(balance * 1e4) / 1e4}).`, action: "recharge" });

  return { sale, creator, page, buyer, needsTrust, feeSource, platformCost, price, quote: { currency, lines, total, balance, ok: problems.length === 0, problems } };
}

export async function quotePageTokens(ctx: Ctx, buyerId: string, saleId: number, payIn: PagePayIn) {
  return (await plan(ctx, buyerId, saleId, payIn)).quote;
}

export async function preparePageTokens(ctx: Ctx, { buyerId, saleId, payIn, signer }: { buyerId: string; saleId: number; payIn: PagePayIn; signer: Signer }) {
  const p = await plan(ctx, buyerId, saleId, payIn);
  if (!p.quote.ok) return { ok: false as const, quote: p.quote };

  const mother = motherKeypair();
  const c = await ctx.db.creator.findUniqueOrThrow({ where: { id: p.creator.id }, select: { storageSecret: true } });
  const storage = Keypair.fromSecret(c.storageSecret);
  const source = p.feeSource === "buyer" ? p.buyer!.raw : (await StellarAccount.loadOrThrow(mother.publicKey(), "Platform account")).raw;
  const payAsset = payIn === "XLM" ? Asset.native() : PLATFORM_ASSET;
  const token = new Asset(p.page.code, p.page.issuer);

  const tx = new TransactionBuilder(source, { fee: TrxBaseFee, networkPassphrase }).setTimeout(TX_TIMEOUT_SECONDS);
  if (p.platformCost > 0) tx.addOperation(Operation.payment({ source: buyerId, destination: mother.publicKey(), asset: PLATFORM_ASSET, amount: amt(p.platformCost) }));
  if (p.needsTrust) {
    if (payIn !== "XLM") tx.addOperation(Operation.payment({ source: mother.publicKey(), destination: buyerId, asset: Asset.native(), amount: amt(BASE_RESERVE_XLM) }));
    tx.addOperation(Operation.changeTrust({ source: buyerId, asset: token }));
  }
  tx.addOperation(Operation.payment({ source: buyerId, destination: storage.publicKey(), asset: payAsset, amount: amt(p.price) }));
  tx.addOperation(Operation.payment({ source: storage.publicKey(), destination: buyerId, asset: token, amount: amt(p.sale.amountToSell) }));
  const built = tx.build();
  const signers = [storage];
  if (p.feeSource === "mother" || (p.needsTrust && payIn !== "XLM")) signers.push(mother);
  built.sign(...signers);

  const lineAmt = (k: CostLine["key"]) => p.quote.lines.filter((l) => l.key === k && l.currency === p.quote.currency).reduce((s, l) => s + l.amount, 0);
  const row = await ctx.db.assetTransaction.create({
    data: {
      type: "PAGE_ASSET_PURCHASE",
      buyerId,
      sellerId: p.creator.id,
      creatorId: p.creator.id,
      quantity: p.sale.amountToSell,
      method: payIn,
      currency: p.quote.currency,
      price: p.price,
      networkFee: lineAmt("networkFee"),
      reserveCost: lineAmt("reserve"),
      total: p.quote.total,
      txHash: built.hash().toString("hex"),
      expiresAt: new Date(Date.now() + TX_TIMEOUT_SECONDS * 1000),
      platformId: ctx.platform.id,
    },
  });
  return { ok: true as const, quote: p.quote, txId: row.id, xdr: await signForUser(built.toXDR(), signer) };
}
