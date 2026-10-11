import "server-only";

import type { AssetTransaction } from "@prisma/client";
import { TransactionBuilder } from "@stellar/stellar-sdk";

import { StellarAccount, horizon, transactionSucceeded } from "~/lib/stellar/account";
import { networkPassphrase } from "~/lib/stellar/constant";
import type { Db } from "~/server/db";

import { announceSettled } from "~/server/notify-events";

import { platformToUsd } from "./prices";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Types that hand a copy to `buyerId` and so create an ownership record. */
const DELIVERS = new Set<AssetTransaction["type"]>(["PURCHASE", "RESALE_PURCHASE", "CLAIM", "GIFT", "GIFT_CLAIM"]);

/**
 * Settles a PENDING transaction from what Horizon says about its hash:
 * success → apply its effects once; failure or expiry → FAILED. Polls briefly
 * because Horizon can lag a few seconds behind a submit.
 */
export async function settle(db: Db, id: string, { attempts = 6, wait = 1500 } = {}) {
  let row = await db.assetTransaction.findUnique({ where: { id } });
  if (!row || row.status !== "PENDING" || !row.txHash) return row;

  for (let i = 0; i < attempts; i++) {
    const ok = await transactionSucceeded(row.txHash);
    if (ok === true) return applySuccess(db, row);
    if (ok === false) return markFailed(db, row, "The transaction failed on the Stellar network.");
    if (i < attempts - 1) await delay(wait);
  }
  if (row.expiresAt && row.expiresAt < new Date()) {
    // Expired and never landed: it can no longer succeed.
    row = await markFailed(db, row, "The transaction expired before it was submitted.");
  }
  return row;
}

async function applySuccess(db: Db, row: AssetTransaction) {
  let applied = false;
  const result = await db.$transaction(async (tx) => {
    // Only the first caller applies effects (status guard).
    const { count } = await tx.assetTransaction.updateMany({
      where: { id: row.id, status: "PENDING" },
      data: { status: "SUCCESS", error: null },
    });
    if (count === 0) return tx.assetTransaction.findUniqueOrThrow({ where: { id: row.id } });
    applied = true;

    if (row.assetId && row.minted > 0) {
      await tx.asset.update({ where: { id: row.assetId }, data: { mintedCount: { increment: row.minted } } });
    }
    if (row.assetId && row.buyerId && DELIVERS.has(row.type)) {
      await tx.user_Asset.create({ data: { userId: row.buyerId, assetId: row.assetId } });
    }
    if (row.type === "LIST" && row.assetId && row.sellerId) {
      // Copies are in storage: the listing goes live (or its price updates).
      const priceUSD = await platformToUsd(row.price);
      await tx.marketAsset.upsert({
        where: { assetId_placerId: { assetId: row.assetId, placerId: row.sellerId } },
        create: { assetId: row.assetId, placerId: row.sellerId, price: row.price, priceUSD, platformId: row.platformId },
        update: { price: row.price, priceUSD },
      });
    }
    return tx.assetTransaction.findUniqueOrThrow({ where: { id: row.id } });
  });
  if (row.type === "UNLIST" && row.marketAssetId) await dropEmptyListing(db, row.marketAssetId);
  if (applied) await announceSettled(db, result);
  return result;
}

/** After taking copies back: remove the listing once its storage holds none. */
async function dropEmptyListing(db: Db, listingId: number) {
  const l = await db.marketAsset.findUnique({ where: { id: listingId }, include: { asset: true, placer: { select: { storagePub: true } } } });
  if (!l?.placer) return;
  const storage = await StellarAccount.load(l.placer.storagePub);
  if ((storage?.tokenBalance(l.asset.code, l.asset.issuer) ?? 0) < 1) await db.marketAsset.delete({ where: { id: listingId } });
}

function markFailed(db: Db, row: AssetTransaction, error: string) {
  return db.assetTransaction.update({ where: { id: row.id }, data: { status: "FAILED", error } });
}

/** Settle a user's open transactions (e.g. a tab closed right after signing). */
export async function settleOpenFor(db: Db, userId: string) {
  const open = await db.assetTransaction.findMany({
    where: { status: "PENDING", OR: [{ buyerId: userId }, { sellerId: userId }] },
    select: { id: true },
    take: 20,
  });
  for (const { id } of open) await settle(db, id, { attempts: 1, wait: 0 });
}

/** Submit a fully signed transaction from the server (custodial users, card deliveries). */
export async function submitXdr(xdr: string) {
  const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase);
  return horizon().submitTransaction(tx);
}
