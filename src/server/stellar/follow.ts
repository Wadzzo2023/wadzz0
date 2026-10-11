import "server-only";

import { Asset, Operation, TransactionBuilder } from "@stellar/stellar-sdk";

import { StellarAccount, toAsset, type AssetRef } from "~/lib/stellar/account";
import { BASE_RESERVE_XLM, TX_TIMEOUT_SECONDS, TrxBaseFee, networkPassphrase } from "~/lib/stellar/constant";

import { motherKeypair, signForUser, type Signer } from "./keys";

/**
 * Following a brand on-chain = trusting its page token. The platform covers
 * the 0.5 XLM reserve and the fee (as it always has). Null when nothing to do.
 */
export async function followTrustlineXdr(userId: string, page: AssetRef, signer: Signer) {
  const acc = await StellarAccount.load(userId);
  if (!acc || acc.hasTrustline(page.code, page.issuer) || !acc.canAddSubentries(1)) return null;
  const mother = motherKeypair();
  const source = await StellarAccount.loadOrThrow(mother.publicKey(), "Platform account");
  const tx = new TransactionBuilder(source.raw, { fee: TrxBaseFee, networkPassphrase })
    .addOperation(Operation.payment({ destination: userId, asset: Asset.native(), amount: BASE_RESERVE_XLM.toFixed(7) }))
    .addOperation(Operation.changeTrust({ source: userId, asset: toAsset(page) }))
    .setTimeout(TX_TIMEOUT_SECONDS)
    .build();
  tx.sign(mother);
  return signForUser(tx.toXDR(), signer);
}
