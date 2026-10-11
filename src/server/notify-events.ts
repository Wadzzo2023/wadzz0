import "server-only";

import type { AssetTransaction } from "@prisma/client";

import type { Db } from "~/server/db";
import { notify, notifyBrand, notifyFan } from "~/server/notify";

const num = (n: number) => Math.round(n * 1e4) / 1e4;

/**
 * Tell the people involved in a settled transaction: the brand its item sold
 * (and earned royalty), the buyer their receipt, a seller their resale sold, a
 * recipient their gift. Runs once, right after the transaction is applied;
 * failures are logged inside `notify` and never fail the purchase.
 */
export async function announceSettled(db: Db, row: AssetTransaction) {
  try {
    const asset = row.assetId
      ? await db.asset.findUnique({ where: { id: row.assetId }, select: { id: true, name: true, limit: true, mintedCount: true, creatorId: true } })
      : null;
    const brandId = row.creatorId ?? asset?.creatorId ?? null;
    const meta = { item: asset?.name ?? row.currency, assetId: asset?.id ?? 0, qty: row.quantity, amount: num(row.price), currency: row.currency };

    switch (row.type) {
      case "PURCHASE":
      case "RESALE_PURCHASE": {
        if (!asset || !row.buyerId) return;
        if (brandId && row.type === "PURCHASE") await notifyBrand(db, { actorId: row.buyerId, type: "ITEM_SOLD", entityId: asset.id, creatorId: brandId, meta });
        if (row.type === "RESALE_PURCHASE") {
          if (row.sellerId) await notifyFan(db, { actorId: row.buyerId, type: "RESALE_SOLD", entityId: asset.id, userId: row.sellerId, meta });
          if (brandId && row.royaltyAmount > 0) {
            await notifyBrand(db, { actorId: row.buyerId, type: "ROYALTY_EARNED", entityId: asset.id, creatorId: brandId, meta: { ...meta, amount: num(row.royaltyAmount) } });
          }
        }
        // the receipt, from the brand (or the seller on a resale)
        const from = row.type === "PURCHASE" ? brandId : row.sellerId;
        if (from) await notifyFan(db, { actorId: from, type: "ITEM_PURCHASED", entityId: asset.id, userId: row.buyerId, meta });
        // the last copy just went
        if (brandId && row.minted > 0 && asset.limit != null && asset.mintedCount >= asset.limit && asset.mintedCount - row.minted < asset.limit) {
          await notifyBrand(db, { actorId: row.buyerId, type: "ITEM_SOLD_OUT", entityId: asset.id, creatorId: brandId, meta });
        }
        return;
      }
      case "GIFT":
        if (asset && row.buyerId && brandId) await notifyFan(db, { actorId: brandId, type: "GIFT_RECEIVED", entityId: asset.id, userId: row.buyerId, meta });
        return;
      case "TRANSFER":
        // a direct send: the recipient (a Wadzzo user) hears about it
        if (row.buyerId && row.sellerId) await notifyFan(db, { actorId: row.buyerId, type: "GIFT_RECEIVED", entityId: asset?.id ?? 0, userId: row.sellerId, meta });
        return;
      case "GIFT_CLAIM": {
        // the gift's sender (stored as the seller when the claim was prepared), if they run a brand
        if (!row.buyerId || !row.sellerId) return;
        const isBrand = await db.creator.findUnique({ where: { id: row.sellerId }, select: { id: true } });
        if (isBrand) await notify(db, { actorId: row.buyerId, type: "GIFT_CLAIMED", entityId: asset?.id ?? 0, recipients: [row.sellerId], creatorIds: [row.sellerId], meta });
        return;
      }
      default:
        return;
    }
  } catch (e) {
    console.error("[announceSettled] failed", row.id, e);
  }
}
