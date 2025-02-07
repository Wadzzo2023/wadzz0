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
import { Key } from "lucide-react";

const log = console;

export async function creatorAprovalTrx({
  pageAsset,
  storage,
}: {
  pageAsset: {
    code: string;
    ipfs: string;
    limit: string;
  };
  storage?: AccountType;
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const storageAcc = storage
    ? Keypair.fromSecret(storage.secretKey)
    : Keypair.random();

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
  });

  if (!storage) {
    // create storage account
    Tx1.addOperation(
      Operation.createAccount({
        destination: storageAcc.publicKey(),
        startingBalance: "1.5", //
      }),
    );
  }

  /** create page asset
   * 1. create issuer
   * 2. set home domain
   * 3. set ipfs
   * 4. change trust
   * 5. payment
   */

  const Tx2 = Tx1.addOperation(
    Operation.payment({
      destination: storageAcc.publicKey(),
      amount: "2",
      asset: Asset.native(),
    }),
  )
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

  Tx2.sign(motherAcc, storageAcc, issuerAcc);

  const xdr = Tx2.toXDR();

  const storageInfo: AccountType = {
    publicKey: storageAcc.publicKey(),
    secretKey: storageAcc.secret(),
  };

  const escrow: AccountType = {
    publicKey: issuerAcc.publicKey(),
    secretKey: issuerAcc.secret(),
  };

  return { xdr, storage: storage ? undefined : storageInfo, escrow };
}
