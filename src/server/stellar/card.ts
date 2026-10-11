import "server-only";

import type { Platform } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import type { Db } from "~/server/db";
import { chargeCard, refundCard } from "~/server/square";

import type { Signer } from "./keys";
import { settle, submitXdr } from "./ledger";
import { preparePurchase, quotePurchase } from "./purchase";

type Ctx = { db: Db; platform: Pick<Platform, "id" | "isRoot"> };

export type CardResult =
  | { status: "delivered"; txId: string }
  | { status: "sign"; txId: string; xdr: string }
  | { status: "pending"; txId: string };

/** Deliver a prepared card purchase: the server sends it unless a browser wallet must sign. */
async function deliver(ctx: Ctx, prepared: { txId: string; xdr: string; buyerMustSign: boolean }, signer: Signer): Promise<CardResult> {
  if (prepared.buyerMustSign && !signer) return { status: "sign", txId: prepared.txId, xdr: prepared.xdr };
  try {
    await submitXdr(prepared.xdr);
  } catch {
    /* settle() records the outcome either way */
  }
  const row = await settle(ctx.db, prepared.txId);
  return row?.status === "SUCCESS" ? { status: "delivered", txId: prepared.txId } : { status: "pending", txId: prepared.txId };
}

/**
 * Card purchase: check, charge, then deliver. The card is only charged after
 * the preflight passes, and refunded if the copy can't be reserved after all.
 */
export async function purchaseWithCard(
  ctx: Ctx,
  { buyerId, listingId, sourceId, verificationToken, signer }: { buyerId: string; listingId: number; sourceId: string; verificationToken?: string; signer: Signer },
): Promise<CardResult> {
  const quote = await quotePurchase(ctx, buyerId, listingId, "CARD");
  if (!quote.ok) throw new TRPCError({ code: "PRECONDITION_FAILED", message: quote.problems[0]?.message ?? "Can't buy this item" });

  const paymentId = await chargeCard({ sourceId, verificationToken, usd: quote.total, note: `Wadzzo item (listing ${listingId})` });

  let prepared;
  try {
    prepared = await preparePurchase(ctx, { buyerId, listingId, method: "CARD", signer, paymentRef: paymentId });
  } catch (e) {
    await refundCard(paymentId, quote.total, "Item could not be reserved").catch(() => undefined);
    throw e;
  }
  if (!prepared.ok) {
    await refundCard(paymentId, quote.total, "Item became unavailable").catch(() => undefined);
    throw new TRPCError({ code: "CONFLICT", message: `${prepared.quote.problems[0]?.message ?? "Item unavailable"} Your card was refunded.` });
  }
  return deliver(ctx, prepared, signer);
}

/** A paid card purchase whose transaction expired or failed: build and deliver it again (no new charge). */
export async function resumeCardPurchase(ctx: Ctx, { txId, buyerId, signer }: { txId: string; buyerId: string; signer: Signer }) {
  const row = await ctx.db.assetTransaction.findUnique({ where: { id: txId } });
  if (!row || row.buyerId !== buyerId || row.method !== "CARD" || !row.paymentRef || !row.marketAssetId) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  if (row.status === "SUCCESS") return { status: "delivered", txId } as CardResult;
  const prepared = await preparePurchase(ctx, { buyerId, listingId: row.marketAssetId, method: "CARD", signer, reuseTxId: txId });
  if (!prepared.ok) {
    throw new TRPCError({ code: "CONFLICT", message: `${prepared.quote.problems[0]?.message ?? "Item unavailable"} Contact support for a refund (payment ${row.paymentRef}).` });
  }
  return deliver(ctx, prepared, signer);
}
