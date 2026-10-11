import "server-only";

import { StellarAccount, type AssetRef } from "~/lib/stellar/account";
import type { Db } from "~/server/db";

/**
 * Who may see what. Item files are for owners only; gated posts for members
 * of their tier. Everything else is public.
 */

/** A creator's page token (followers hold it; tiers need an amount of it). */
export function pageAssetRef(creator: { pageAsset: AssetRef | null; customPageAssetCodeIssuer: string | null } | null): AssetRef | null {
  if (!creator) return null;
  if (creator.pageAsset) return creator.pageAsset;
  const [code, issuer] = creator.customPageAssetCodeIssuer?.split("-") ?? [];
  return code && issuer?.length === 56 ? { code, issuer } : null;
}

/**
 * Whether `userId` owns the item: its creator, or a copy in their wallet or
 * their resale storage. On-chain balances are the truth, so a copy that was
 * bought, gifted or claimed counts, and one that was resold no longer does.
 */
export async function ownsAsset(db: Db, userId: string, asset: { id: number; code: string; issuer: string; creatorId: string | null }) {
  if (asset.creatorId === userId) return true;
  const wallet = await StellarAccount.load(userId);
  if (wallet && wallet.tokenBalance(asset.code, asset.issuer) > 0) return true;
  const storage = await db.creator.findUnique({ where: { id: userId }, select: { storagePub: true } });
  if (storage) {
    const acc = await StellarAccount.load(storage.storagePub);
    if (acc && acc.tokenBalance(asset.code, asset.issuer) > 0) return true;
  }
  return false;
}

/** Page-token balance a viewer holds for each creator (one Horizon call per viewer). */
export async function tierBalances(viewerId: string | undefined) {
  const acc = viewerId ? await StellarAccount.load(viewerId) : null;
  return (ref: AssetRef | null) => (acc && ref ? acc.tokenBalance(ref.code, ref.issuer) : 0);
}
