import {
  BASE_FEE,
  Keypair,
  Operation,
  Server,
  TransactionBuilder,
  Asset,
  AuthClawbackEnabledFlag,
  AuthRevocableFlag,
} from "stellar-sdk";
import {
  PLATFROM_ASSET,
  PLATFROM_FEE,
  STELLAR_URL,
  networkPassphrase,
} from "./constant";
import { MyAssetType } from "./utils";
import { env } from "~/env";
import { STROOP } from "../marketplace/constant";

const log = console;
// transection variables

export async function getClawbackAsPayment({
  userPubkey,
  assetInfo,
  price,
  creatorId,
  creatorStorageSec,
}: {
  userPubkey: string;
  assetInfo: MyAssetType;
  price: string;
  creatorId: string;
  creatorStorageSec: string;
}) {
  const server = new Server(STELLAR_URL);

  const creatorStorageAcc = Keypair.fromSecret(creatorStorageSec);
  const asset = new Asset(assetInfo.code, assetInfo.issuer);

  const transactionInializer = await server.loadAccount(userPubkey);

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  })

    .addOperation(
      Operation.changeTrust({
        asset,
      }),
    )
    // 0
    .addOperation(
      Operation.payment({
        destination: userPubkey,
        amount: STROOP,
        asset,
        source: creatorStorageAcc.publicKey(),
      }),
    )
    // pay the creator the price amount
    // .addOperation(
    //   Operation.payment({
    //     amount: price,
    //     asset: PLATFROM_ASSET,
    //     destination: creatorId,
    //   }),
    // )
    // sending platform fee.
    // .addOperation(
    //   Operation.payment({
    //     amount: PLATFROM_FEE,
    //     asset: PLATFROM_ASSET,
    //     destination: creatorStorageAcc.publicKey(),
    //   }),
    // )
    .setTimeout(0)
    .build();

  Tx1.sign(creatorStorageAcc);

  return Tx1.toXDR();
}
