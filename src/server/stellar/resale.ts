import "server-only";

import { Asset, Keypair, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import type { Platform } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import { StellarAccount, toAsset } from "~/lib/stellar/account";
import {
  BASE_RESERVE_XLM,
  NEW_ACCOUNT_XLM,
  PLATFORM_ASSET,
  PLATFORM_FEE,
  TX_TIMEOUT_SECONDS,
  TrxBaseFee,
  TrxBaseFeeInPlatformAsset,
  networkPassphrase,
} from "~/lib/stellar/constant";
import type { CostLine, Problem } from "~/lib/stellar/quote";
import type { Db } from "~/server/db";
import { truncateString } from "~/utils/string";

import { motherKeypair, signForUser, type Signer } from "./keys";
import { xlmToPlatform } from "./prices";

type Ctx = { db: Db; platform: Pick<Platform, "id" | "isRoot"> };
export type PayIn = "PLATFORM_ASSET" | "XLM";

const amt = (n: number) => (Math.round(n * 1e7) / 1e7).toFixed(7);
const code = PLATFORM_ASSET.code;

/** A seller-side quote: what an action costs and whether it can go through. */
export type ActionQuote = { currency: string; lines: CostLine[]; total: number; balance: number; ok: boolean; problems: Problem[] };

function finish(lines: CostLine[], currency: string, balance: number, problems: Problem[]): ActionQuote {
  const total = Math.round(lines.filter((l) => l.inTotal).reduce((s, l) => s + l.amount, 0) * 1e7) / 1e7;
  if (balance < total && !problems.length) {
    problems.push({ code: currency === "XLM" ? "INSUFFICIENT_XLM" : "INSUFFICIENT_FUNDS", message: `You need ${total} ${currency} (you have ${Math.round(balance * 1e4) / 1e4}).`, action: "recharge" });
  }
  return { currency, lines, total, balance, ok: problems.length === 0, problems };
}

/**
 * Cost of XLM the platform fronts for the seller (reserves), plus the flat
 * fees, in the chosen currency. XLM payers send the XLM themselves.
 */
async function costLines(payIn: PayIn, xlmNeeded: number, ops: number, label: string): Promise<CostLine[]> {
  const networkXlm = (ops * Number(TrxBaseFee)) / 1e7;
  if (payIn === "XLM") {
    return [
      ...(xlmNeeded ? [{ key: "reserve" as const, label, amount: xlmNeeded, currency: "XLM", inTotal: true }] : []),
      { key: "networkFee", label: "Network fee", amount: networkXlm, currency: "XLM", inTotal: true },
    ];
  }
  return [
    ...(xlmNeeded ? [{ key: "reserve" as const, label, amount: await xlmToPlatform(xlmNeeded), currency: code, inTotal: true }] : []),
    { key: "platformFee", label: "Platform fee", amount: Number(PLATFORM_FEE), currency: code, inTotal: true },
    { key: "networkFee", label: "Network fee", amount: Number(TrxBaseFeeInPlatformAsset), currency: code, inTotal: true },
  ];
}

async function sellerAccount(userId: string, problems: Problem[]) {
  const acc = await StellarAccount.load(userId);
  if (!acc) problems.push({ code: "ACCOUNT_INACTIVE", message: "Your wallet isn't active on Stellar yet." });
  return acc;
}

const balanceIn = (acc: StellarAccount | null, payIn: PayIn) => (acc ? (payIn === "XLM" ? acc.spendableXlm() : acc.platformBalance()) : 0);

/* ───────────────────────────── storage account ───────────────────────────── */

/** The user's selling storage (a Creator row: brands have one; fans get one when they first resell). */
export async function getStorage(db: Db, userId: string) {
  return db.creator.findUnique({ where: { id: userId }, select: { storagePub: true, notCreatorButSeller: true } });
}

export async function quoteStorageSetup(userId: string, payIn: PayIn) {
  const problems: Problem[] = [];
  const acc = await sellerAccount(userId, problems);
  const lines = await costLines(payIn, NEW_ACCOUNT_XLM, payIn === "XLM" ? 1 : 2, "Storage account deposit");
  return finish(lines, payIn === "XLM" ? "XLM" : code, balanceIn(acc, payIn), problems);
}

/**
 * Opens a storage account for reselling. The key is created and kept on the
 * server; the user pays the account's deposit (and the platform fee when
 * paying in tokens). The storage row is saved once the account exists.
 */
export async function prepareStorageSetup(ctx: Ctx, { userId, payIn, signer }: { userId: string; payIn: PayIn; signer: Signer }) {
  const existing = await getStorage(ctx.db, userId);
  if (existing && (await StellarAccount.load(existing.storagePub))) throw new TRPCError({ code: "CONFLICT", message: "You already have a storage account." });

  const quote = await quoteStorageSetup(userId, payIn);
  if (!quote.ok) return { ok: false as const, quote };

  const storage = Keypair.random();
  const mother = motherKeypair();
  const user = await StellarAccount.loadOrThrow(userId);
  const tx = new TransactionBuilder(user.raw, { fee: TrxBaseFee, networkPassphrase }).setTimeout(TX_TIMEOUT_SECONDS);
  if (payIn === "XLM") {
    tx.addOperation(Operation.createAccount({ destination: storage.publicKey(), startingBalance: amt(NEW_ACCOUNT_XLM) }));
  } else {
    tx.addOperation(Operation.payment({ destination: mother.publicKey(), asset: PLATFORM_ASSET, amount: amt(quote.total) }));
    tx.addOperation(Operation.createAccount({ source: mother.publicKey(), destination: storage.publicKey(), startingBalance: amt(NEW_ACCOUNT_XLM) }));
  }
  const built = tx.build();
  if (payIn !== "XLM") built.sign(mother);

  // Save (or replace a never-activated) storage now; it's only used once it exists on-chain.
  const data = { storagePub: storage.publicKey(), storageSecret: storage.secret() };
  if (existing) await ctx.db.creator.update({ where: { id: userId }, data });
  else {
    await ctx.db.creator.create({
      data: { id: userId, name: truncateString(userId), bio: "", aprovalSend: false, notCreatorButSeller: true, platformId: ctx.platform.id, ...data },
    });
  }

  const row = await ctx.db.assetTransaction.create({
    data: {
      type: "STORAGE_SETUP",
      sellerId: userId,
      method: payIn,
      currency: quote.currency,
      reserveCost: quote.lines.find((l) => l.key === "reserve")?.amount ?? 0,
      platformFee: quote.lines.find((l) => l.key === "platformFee")?.amount ?? 0,
      networkFee: quote.lines.find((l) => l.key === "networkFee")?.amount ?? 0,
      total: quote.total,
      txHash: built.hash().toString("hex"),
      expiresAt: new Date(Date.now() + TX_TIMEOUT_SECONDS * 1000),
      platformId: ctx.platform.id,
    },
  });
  return { ok: true as const, quote, txId: row.id, xdr: await signForUser(built.toXDR(), signer) };
}

/* ───────────────────────────── list / unlist ───────────────────────────── */

async function loadOwned(ctx: Ctx, userId: string, assetId: number) {
  const asset = await ctx.db.asset.findUnique({ where: { id: assetId }, select: { id: true, code: true, issuer: true, name: true, creatorId: true } });
  if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
  const storage = await getStorage(ctx.db, userId);
  if (!storage) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Open a storage account first." });
  return { asset, storagePub: storage.storagePub };
}

export async function quoteListing(ctx: Ctx, { userId, assetId, copies, payIn }: { userId: string; assetId: number; copies: number; payIn: PayIn }) {
  const problems: Problem[] = [];
  const { asset, storagePub } = await loadOwned(ctx, userId, assetId);
  const [acc, storage] = await Promise.all([sellerAccount(userId, problems), StellarAccount.load(storagePub)]);
  if (!storage) problems.push({ code: "ACCOUNT_INACTIVE", message: "Your storage account isn't active yet." });
  const owned = acc?.tokenBalance(asset.code, asset.issuer) ?? 0;
  if (owned < copies) problems.push({ code: "SOLD_OUT", message: `You own ${owned} ${owned === 1 ? "copy" : "copies"} of this item.` });
  const needsTrust = Boolean(storage && !storage.hasTrustline(asset.code, asset.issuer));
  if (needsTrust && storage && !storage.canAddSubentries(1)) problems.push({ code: "TOO_MANY_ASSETS", message: "Your storage holds the maximum number of different items." });
  const ops = 1 + (needsTrust ? 2 : 0) + (payIn === "XLM" ? 0 : 1);
  const lines = await costLines(payIn, needsTrust ? BASE_RESERVE_XLM : 0, ops, "Storage reserve for this item");
  return { quote: finish(lines, payIn === "XLM" ? "XLM" : code, balanceIn(acc, payIn), problems), needsTrust, asset, storagePub };
}

/** Moves copies into the user's storage; the listing goes live when the transaction lands. */
export async function prepareListing(
  ctx: Ctx,
  input: { userId: string; assetId: number; copies: number; price: number; payIn: PayIn; signer: Signer },
) {
  const { quote, needsTrust, asset, storagePub } = await quoteListing(ctx, input);
  if (!quote.ok) return { ok: false as const, quote };

  const mother = motherKeypair();
  const user = await StellarAccount.loadOrThrow(input.userId);
  const assetObj = toAsset(asset);
  const tx = new TransactionBuilder(user.raw, { fee: TrxBaseFee, networkPassphrase }).setTimeout(TX_TIMEOUT_SECONDS);
  const signers: Keypair[] = [];

  if (input.payIn !== "XLM") tx.addOperation(Operation.payment({ destination: mother.publicKey(), asset: PLATFORM_ASSET, amount: amt(quote.total) }));
  if (needsTrust) {
    const funder = input.payIn === "XLM" ? undefined : mother.publicKey();
    tx.addOperation(Operation.payment({ source: funder, destination: storagePub, asset: Asset.native(), amount: amt(BASE_RESERVE_XLM) }));
    tx.addOperation(Operation.changeTrust({ source: storagePub, asset: assetObj }));
    const c = await ctx.db.creator.findUniqueOrThrow({ where: { id: input.userId }, select: { storageSecret: true } });
    signers.push(Keypair.fromSecret(c.storageSecret));
    if (funder) signers.push(mother);
  }
  tx.addOperation(Operation.payment({ destination: storagePub, asset: assetObj, amount: amt(input.copies) }));
  const built = tx.build();
  if (signers.length) built.sign(...signers);

  const row = await ctx.db.assetTransaction.create({
    data: {
      type: "LIST",
      assetId: asset.id,
      quantity: input.copies,
      sellerId: input.userId,
      creatorId: asset.creatorId,
      method: input.payIn,
      currency: quote.currency,
      // For LIST rows `price` is the asking price per copy (platform token) applied on success.
      price: input.price,
      reserveCost: quote.lines.find((l) => l.key === "reserve")?.amount ?? 0,
      platformFee: quote.lines.find((l) => l.key === "platformFee")?.amount ?? 0,
      networkFee: quote.lines.find((l) => l.key === "networkFee")?.amount ?? 0,
      total: quote.total,
      txHash: built.hash().toString("hex"),
      expiresAt: new Date(Date.now() + TX_TIMEOUT_SECONDS * 1000),
      platformId: ctx.platform.id,
    },
  });
  return { ok: true as const, quote, txId: row.id, xdr: await signForUser(built.toXDR(), input.signer) };
}

/** Takes copies back from storage to the user's wallet (the user pays the network fee). */
export async function prepareUnlisting(ctx: Ctx, { userId, listingId, copies, signer }: { userId: string; listingId: number; copies?: number; signer: Signer }) {
  const listing = await ctx.db.marketAsset.findUnique({ where: { id: listingId }, include: { asset: { select: { id: true, code: true, issuer: true } } } });
  if (!listing || listing.placerId !== userId) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
  const c = await ctx.db.creator.findUniqueOrThrow({ where: { id: userId }, select: { storagePub: true, storageSecret: true } });
  const [user, storage] = await Promise.all([StellarAccount.loadOrThrow(userId), StellarAccount.loadOrThrow(c.storagePub, "Storage")]);
  const inStorage = Math.floor(storage.tokenBalance(listing.asset.code, listing.asset.issuer));
  const n = Math.min(copies ?? inStorage, inStorage);

  if (n <= 0) {
    // Nothing left on-chain: just remove the listing.
    await ctx.db.marketAsset.delete({ where: { id: listingId } });
    return { ok: true as const, txId: null, xdr: null };
  }
  if (!user.hasTrustline(listing.asset.code, listing.asset.issuer) && !user.canAddSubentries(1)) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Your wallet can't hold another item type." });
  }
  const networkXlm = (2 * Number(TrxBaseFee)) / 1e7;
  if (user.spendableXlm() < networkXlm) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "You need a little XLM for the network fee." });

  const assetObj = toAsset(listing.asset);
  const tx = new TransactionBuilder(user.raw, { fee: TrxBaseFee, networkPassphrase }).setTimeout(TX_TIMEOUT_SECONDS);
  if (!user.hasTrustline(listing.asset.code, listing.asset.issuer)) tx.addOperation(Operation.changeTrust({ asset: assetObj }));
  tx.addOperation(Operation.payment({ source: c.storagePub, destination: userId, asset: assetObj, amount: amt(n) }));
  const built = tx.build();
  built.sign(Keypair.fromSecret(c.storageSecret));

  const row = await ctx.db.assetTransaction.create({
    data: {
      type: "UNLIST",
      assetId: listing.asset.id,
      marketAssetId: listingId,
      quantity: n,
      sellerId: userId,
      method: "XLM",
      currency: "XLM",
      networkFee: networkXlm,
      total: networkXlm,
      txHash: built.hash().toString("hex"),
      expiresAt: new Date(Date.now() + TX_TIMEOUT_SECONDS * 1000),
      platformId: ctx.platform.id,
    },
  });
  return { ok: true as const, txId: row.id, xdr: await signForUser(built.toXDR(), signer) };
}
