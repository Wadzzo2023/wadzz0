import {
  Keypair,
  Operation,
  Horizon,
  TransactionBuilder,
  Asset,
} from "@stellar/stellar-sdk";
import {
  PLATFROM_ASSET,
  PLATFROM_FEE,
  STELLAR_URL,
  networkPassphrase,
} from "../constant";
import { env } from "~/env";
import { MyAssetType } from "./utils";
import { STROOP } from "../marketplace/constant";

const log = console;

export async function buyAssetTrx({
  customerPubkey,
  assetType,
  creatorId,
  price,
  storageSecret,
}: {
  customerPubkey: string;
  assetType: MyAssetType;
  price: string;
  creatorId: string;
  storageSecret: string;
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const asset = new Asset(assetType.code, assetType.issuer);

  const assetStorage = Keypair.fromSecret(storageSecret);
  const maotherAcc = Keypair.fromSecret(env.MOTHER_SECRET);

  const transactionInializer = await server.loadAccount(customerPubkey);

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  })

    // change trust
    .addOperation(
      Operation.changeTrust({
        asset,
      }),
    )

    // get payment
    .addOperation(
      Operation.payment({
        asset,
        amount: STROOP,
        source: assetStorage.publicKey(),
        destination: customerPubkey,
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
        destination: maotherAcc.publicKey(),
      }),
    )

    .setTimeout(0)
    .build();

  Tx1.sign(assetStorage);
  return Tx1.toXDR();
}
