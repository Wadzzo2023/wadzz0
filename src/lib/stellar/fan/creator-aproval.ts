import {
  Asset,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

import { env } from "~/env";
import { networkPassphrase, STELLAR_URL, TrxBaseFee } from "../constant";
import { SignUserType } from "../utils";
import { AccountType } from "./utils";

const log = console;

export async function creatorAprovalTrx({
  pageAsset,
}: {
  pageAsset: {
    code: string;
    ipfs: string;
    limit: string;
  };
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const storageAcc = Keypair.random();

  const motherAcc = Keypair.fromSecret(env.MOTHER_SECRET);

  // page asset issuer
  const issuerAcc = Keypair.random();
  const asset = new Asset(pageAsset.code, issuerAcc.publicKey());

  // mother start trx
  const transactionInitializer = await server.loadAccount(
    motherAcc.publicKey(),
  );

  const Tx1 = new TransactionBuilder(transactionInitializer, {
    fee: TrxBaseFee,
    networkPassphrase,
  })
    // create storage account
    .addOperation(
      Operation.createAccount({
        destination: storageAcc.publicKey(),
        startingBalance: "3", // 1 (own) + 1.5 (for issuer) + 0.5 (for trust)
      }),
    )
    /** create page asset
     * 1. create issuer
     * 2. set home domain
     * 3. set ipfs
     * 4. change trust
     * 5. payment
     */

    .addOperation(
      Operation.createAccount({
        destination: issuerAcc.publicKey(),
        startingBalance: "1.5",
        source: storageAcc.publicKey(),
      }),
    )
    .addOperation(
      Operation.setOptions({
        homeDomain: env.NEXT_PUBLIC_HOME_DOMAIN,
        source: issuerAcc.publicKey(),
      }),
    )
    .addOperation(
      Operation.manageData({
        name: "ipfs",
        value: pageAsset.ipfs,
        source: issuerAcc.publicKey(),
      }),
    )
    .addOperation(
      Operation.changeTrust({
        asset,
        source: storageAcc.publicKey(),
      }),
    )
    .addOperation(
      Operation.payment({
        asset: asset,
        amount: pageAsset.limit,
        source: issuerAcc.publicKey(),
        destination: storageAcc.publicKey(),
      }),
    )
    .setTimeout(0)
    .build();

  Tx1.sign(motherAcc, storageAcc, issuerAcc);

  const xdr = Tx1.toXDR();

  const storage: AccountType = {
    publicKey: storageAcc.publicKey(),
    secretKey: storageAcc.secret(),
  };

  const escrow: AccountType = {
    publicKey: issuerAcc.publicKey(),
    secretKey: issuerAcc.secret(),
  };

  return { xdr, storage, escrow };
}
