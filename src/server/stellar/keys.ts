import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import { getAccSecretFromRubyApi } from "package/connect_wallet/src/lib/stellar/get-acc-secret";

import { env } from "~/env";
import { networkPassphrase } from "~/lib/stellar/constant";
import type { Db } from "~/server/db";

/**
 * Secrets the server signs with. Issuer secrets are stored encrypted
 * (AES-256-GCM, "v1:<iv>:<tag>:<ciphertext>" in base64) and only decrypted
 * for the moment a transaction is signed.
 */
function key() {
  const raw = env.ISSUER_ENCRYPTION_KEY;
  const buf = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("ISSUER_ENCRYPTION_KEY must be 32 bytes (64 hex chars or base64)");
  return buf;
}

export function encryptSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(":");
}

export function decryptSecret(payload: string) {
  const [v, iv, tag, data] = payload.split(":");
  if (v !== "v1" || !iv || !tag || !data) throw new Error("Unknown secret format");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}

export const motherKeypair = () => Keypair.fromSecret(env.MOTHER_SECRET);
/** The platform's own storage (admin items, legacy music). */
export const platformStorageKeypair = () => Keypair.fromSecret(env.STORAGE_SECRET);

/**
 * The keypair that can mint an asset: the creator's CreatorIssuer for new
 * assets, or the legacy per-asset issuer secret. Null when nobody can mint
 * more (legacy assets created without a stored secret).
 */
export async function issuerKeypairFor(db: Db, asset: { id: number; issuer: string; creatorId: string | null }) {
  if (asset.creatorId) {
    const ci = await db.creatorIssuer.findUnique({ where: { creatorId: asset.creatorId } });
    if (ci?.publicKey === asset.issuer) return Keypair.fromSecret(decryptSecret(ci.secretEncrypted));
  }
  const legacy = await db.asset.findUnique({ where: { id: asset.id }, select: { issuerPrivate: true } });
  if (legacy?.issuerPrivate) {
    const kp = Keypair.fromSecret(legacy.issuerPrivate);
    if (kp.publicKey() === asset.issuer) return kp;
  }
  return null;
}

/** A creator's storage keypair (the account that holds their stock). */
export async function storageKeypairFor(db: Db, creatorId: string) {
  const c = await db.creator.findUnique({ where: { id: creatorId }, select: { storageSecret: true, storagePub: true } });
  if (!c?.storageSecret) return null;
  return Keypair.fromSecret(c.storageSecret);
}

/** How the signed-in user signs: custodial (email/social) accounts are signed here, wallets sign in the browser. */
export type Signer = { email: string } | undefined;

/** Adds the custodial user's signature when they don't use a browser wallet. */
export async function signForUser(xdr: string, signer: Signer) {
  if (!signer?.email) return xdr;
  const secret = await getAccSecretFromRubyApi(signer.email);
  const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase);
  tx.sign(Keypair.fromSecret(secret));
  return tx.toXDR();
}
