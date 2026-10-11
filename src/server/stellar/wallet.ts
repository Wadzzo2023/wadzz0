import "server-only";

import { Asset, Keypair, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import type { Platform } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { getAccSecretFromRubyApi } from "package/connect_wallet/src/lib/stellar/get-acc-secret";

import { StellarAccount, horizon } from "~/lib/stellar/account";
import { BASE_RESERVE_XLM, PLATFORM_ASSET, TX_TIMEOUT_SECONDS, TrxBaseFee, networkPassphrase } from "~/lib/stellar/constant";
import type { Db } from "~/server/db";
import { chargeCard, refundCard } from "~/server/square";

import { motherKeypair, platformStorageKeypair, signForUser, type Signer } from "./keys";
import { settle, submitXdr } from "./ledger";
import { platformToXlm } from "./prices";

type Ctx = { db: Db; platform: Pick<Platform, "id" | "isRoot"> };
const amt = (n: number) => (Math.floor(n * 1e7) / 1e7).toFixed(7);

/** Card packs (price in USD → tokens). Same packs as before; the server decides the amount, never the browser. */
const PACK_PRICES = [1.99, 4.99, 9.99, 19.99, 24.99, 49.99, 99.99];
const packTokens = (usd: number) => Math.round(usd * 100 + 1);

export async function tokenPacks() {
  const mother = await StellarAccount.load(motherKeypair().publicKey());
  const inventory = mother?.platformBalance() ?? 0;
  return PACK_PRICES.map((usd) => ({ usd, tokens: packTokens(usd) })).filter((p) => p.tokens <= inventory);
}

/**
 * Custodial accounts that can't receive tokens yet are activated / given the
 * token trustline first (the platform covers it, as before). Wallet users must
 * add the trustline themselves.
 */
async function ensureCanReceiveTokens(userId: string, email: string | null | undefined) {
  const acc = await StellarAccount.load(userId);
  if (acc?.trustsPlatformAsset()) return;
  if (!email) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Add ${PLATFORM_ASSET.code} to your wallet first.` });
  const userKp = Keypair.fromSecret(await getAccSecretFromRubyApi(email));
  const mother = motherKeypair();
  const source = await StellarAccount.loadOrThrow(mother.publicKey(), "Platform account");
  const tx = new TransactionBuilder(source.raw, { fee: TrxBaseFee, networkPassphrase }).setTimeout(TX_TIMEOUT_SECONDS);
  if (!acc) tx.addOperation(Operation.createAccount({ destination: userId, startingBalance: "2.5" }));
  else tx.addOperation(Operation.payment({ destination: userId, asset: Asset.native(), amount: amt(BASE_RESERVE_XLM) }));
  tx.addOperation(Operation.changeTrust({ source: userId, asset: PLATFORM_ASSET }));
  const built = tx.build();
  built.sign(mother, userKp);
  await horizon().submitTransaction(built);
}

/** Buy a token pack by card: charge, then the platform sends the tokens (refunded if that fails). */
export async function buyTokenPack(
  ctx: Ctx,
  { userId, email, usd, sourceId, verificationToken }: { userId: string; email?: string | null; usd: number; sourceId: string; verificationToken?: string },
) {
  if (!PACK_PRICES.includes(usd)) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown pack" });
  const tokens = packTokens(usd);
  if (!(await tokenPacks()).some((p) => p.usd === usd)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This pack is sold out right now." });
  await ensureCanReceiveTokens(userId, email);

  const paymentId = await chargeCard({ sourceId, verificationToken, usd, note: `${tokens} ${PLATFORM_ASSET.code}` });
  const mother = motherKeypair();
  const source = await StellarAccount.loadOrThrow(mother.publicKey(), "Platform account");
  const tx = new TransactionBuilder(source.raw, { fee: TrxBaseFee, networkPassphrase })
    .addOperation(Operation.payment({ destination: userId, asset: PLATFORM_ASSET, amount: amt(tokens) }))
    .setTimeout(TX_TIMEOUT_SECONDS)
    .build();
  tx.sign(mother);
  const row = await ctx.db.assetTransaction.create({
    data: {
      type: "TOKEN_PURCHASE",
      buyerId: userId,
      method: "CARD",
      currency: "USD",
      price: usd,
      total: usd,
      quantity: tokens,
      paymentRef: paymentId,
      txHash: tx.hash().toString("hex"),
      expiresAt: new Date(Date.now() + TX_TIMEOUT_SECONDS * 1000),
      platformId: ctx.platform.id,
    },
  });
  try {
    await submitXdr(tx.toXDR());
  } catch {
    /* settle decides */
  }
  const settled = await settle(ctx.db, row.id);
  if (settled?.status !== "SUCCESS") {
    await refundCard(paymentId, usd, "Token delivery failed").catch(() => undefined);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "We couldn't deliver the tokens, so your card was refunded." });
  }
  return { tokens };
}

/** Swap platform tokens for XLM at the current rate (XLM comes from the platform storage). */
export async function quoteSwap(userId: string, tokens: number) {
  const [acc, xlm] = await Promise.all([StellarAccount.load(userId), platformToXlm(tokens)]);
  const balance = acc?.platformBalance() ?? 0;
  return { tokens, xlm: Math.floor(xlm * 1e7) / 1e7, balance, ok: Boolean(acc) && balance >= tokens && tokens > 0 };
}

export async function prepareSwap(ctx: Ctx, { userId, tokens, signer }: { userId: string; tokens: number; signer: Signer }) {
  const q = await quoteSwap(userId, tokens);
  if (!q.ok) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `You have ${q.balance} ${PLATFORM_ASSET.code}.` });
  const storage = platformStorageKeypair();
  const user = await StellarAccount.loadOrThrow(userId);
  const tx = new TransactionBuilder(user.raw, { fee: TrxBaseFee, networkPassphrase })
    .addOperation(Operation.payment({ destination: storage.publicKey(), asset: PLATFORM_ASSET, amount: amt(tokens) }))
    .addOperation(Operation.payment({ source: storage.publicKey(), destination: userId, asset: Asset.native(), amount: amt(q.xlm) }))
    .setTimeout(TX_TIMEOUT_SECONDS)
    .build();
  tx.sign(storage);
  const row = await ctx.db.assetTransaction.create({
    data: {
      type: "TOKEN_SWAP",
      buyerId: userId,
      method: "PLATFORM_ASSET",
      currency: PLATFORM_ASSET.code,
      price: tokens,
      total: tokens,
      txHash: tx.hash().toString("hex"),
      expiresAt: new Date(Date.now() + TX_TIMEOUT_SECONDS * 1000),
      platformId: ctx.platform.id,
    },
  });
  return { txId: row.id, xdr: await signForUser(tx.toXDR(), signer), xlm: q.xlm };
}

/** Gifts waiting for me (claimable balances). */
export async function pendingGifts(userId: string) {
  const res = await horizon().claimableBalances().claimant(userId).limit(50).order("desc").call();
  return res.records.map((r) => {
    const [code, issuer] = r.asset === "native" ? ["XLM", ""] : r.asset.split(":");
    return { id: r.id, code: code ?? "", issuer: issuer ?? "", amount: Number(r.amount), sponsor: r.sponsor ?? null };
  });
}

/** Accept a pending gift (adds the trustline if needed; the user pays the network fee and reserve). */
export async function prepareGiftClaim(ctx: Ctx, { userId, balanceId, signer }: { userId: string; balanceId: string; signer: Signer }) {
  const gift = (await pendingGifts(userId)).find((g) => g.id === balanceId);
  if (!gift) throw new TRPCError({ code: "NOT_FOUND", message: "Gift not found" });
  const user = await StellarAccount.loadOrThrow(userId);
  const needsTrust = gift.code !== "XLM" && !user.hasTrustline(gift.code, gift.issuer);
  const need = (needsTrust ? BASE_RESERVE_XLM : 0) + (2 * Number(TrxBaseFee)) / 1e7;
  if (user.spendableXlm() < need) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `You need ${need} XLM available to accept this gift.` });

  const tx = new TransactionBuilder(user.raw, { fee: TrxBaseFee, networkPassphrase }).setTimeout(TX_TIMEOUT_SECONDS);
  if (needsTrust) tx.addOperation(Operation.changeTrust({ asset: new Asset(gift.code, gift.issuer) }));
  tx.addOperation(Operation.claimClaimableBalance({ balanceId }));
  const built = tx.build();
  const sender = gift.sponsor ? await ctx.db.user.findUnique({ where: { id: gift.sponsor }, select: { id: true } }) : null;
  const asset = gift.code !== "XLM" ? await ctx.db.asset.findFirst({ where: { code: gift.code, issuer: gift.issuer }, select: { id: true } }) : null;
  const row = await ctx.db.assetTransaction.create({
    data: {
      type: "GIFT_CLAIM",
      assetId: asset?.id,
      buyerId: userId,
      // who sent the gift (a Wadzzo user), so a brand can be told it was claimed
      sellerId: sender?.id,
      quantity: Math.floor(gift.amount),
      method: "NONE",
      currency: "XLM",
      reserveCost: needsTrust ? BASE_RESERVE_XLM : 0,
      networkFee: need - (needsTrust ? BASE_RESERVE_XLM : 0),
      total: need,
      txHash: built.hash().toString("hex"),
      expiresAt: new Date(Date.now() + TX_TIMEOUT_SECONDS * 1000),
      platformId: ctx.platform.id,
    },
  });
  return { txId: row.id, xdr: await signForUser(built.toXDR(), signer) };
}
