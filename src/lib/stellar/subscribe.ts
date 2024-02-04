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
import { STELLAR_URL, networkPassphrase } from "./constant";
import { MyAssetType } from "./utils";
import { env } from "~/env";

const log = console;
// transection variables

export async function getClawbackAsPayment({
  userPubkey,
  assetInfo,
}: {
  userPubkey: string;
  assetInfo: MyAssetType;
}) {
  const server = new Server(STELLAR_URL);

  const distributorAcc = Keypair.fromSecret(env.DISTRIBUTOR_SECRET);
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
        amount: "1",
        asset,
        source: distributorAcc.publicKey(),
      }),
    )
    .setTimeout(0)
    .build();

  await Tx1.sign(distributorAcc);

  return Tx1.toXDR();
}
