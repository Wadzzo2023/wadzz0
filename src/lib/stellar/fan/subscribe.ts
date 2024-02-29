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
  LOWEST_ASSET_AMOUNT,
  PLATFROM_ASSET,
  PLATFROM_FEE,
  STELLAR_URL,
  networkPassphrase,
} from "./constant";
import { MyAssetType } from "./utils";
import { env } from "~/env";

const log = console;
// transection variables

export async function getClawbackAsPayment({
  userPubkey,
  assetInfo,
  price,
  creatorId,
}: {
  userPubkey: string;
  assetInfo: MyAssetType;
  price: string;
  creatorId: string;
}) {
  const server = new Server(STELLAR_URL);

  const distributorAcc = Keypair.fromSecret(env.STORAGE_SECRET);
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
        amount: LOWEST_ASSET_AMOUNT,
        asset,
        source: distributorAcc.publicKey(),
      }),
    )
    // pay the creator the price amount
    .addOperation(
      Operation.payment({
        amount: price,
        asset: PLATFROM_ASSET,
        destination: creatorId,
      }),
    )
    // sending platform fee.
    .addOperation(
      Operation.payment({
        amount: PLATFROM_FEE,
        asset: PLATFROM_ASSET,
        destination: distributorAcc.publicKey(),
      }),
    )
    .setTimeout(0)
    .build();

  Tx1.sign(distributorAcc);

  return Tx1.toXDR();
}
