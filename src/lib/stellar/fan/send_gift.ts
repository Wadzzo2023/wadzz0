import {
  Asset,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { env } from "~/env";
import { STELLAR_URL, networkPassphrase } from "../constant";
import { MyAssetType } from "./utils";

const log = console;

export async function sendGift({
  customerPubkey,
  creatorPageAsset,
  creatorPub,
  price,
  creatorStorageSec,
}: {
  customerPubkey: string;
  creatorPageAsset: MyAssetType;
  price: number;
  creatorPub: string;
  creatorStorageSec: string;
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const asset = new Asset(creatorPageAsset.code, creatorPageAsset.issuer);

  const assetStorage = Keypair.fromSecret(creatorStorageSec);
  const maotherAcc = Keypair.fromSecret(env.MOTHER_SECRET);

  const transactionInializer = await server.loadAccount(maotherAcc.publicKey());

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  })

    // // change trust
    // .addOperation(
    //   Operation.changeTrust({
    //     asset,
    //   }),
    // )

    // get payment
    .addOperation(
      Operation.payment({
        asset,
        amount: price.toFixed(7),
        source: assetStorage.publicKey(),
        destination: customerPubkey,
      }),
    )
    // pay the creator the price amount
    // .addOperation(
    //   Operation.payment({
    //     amount: price,
    //     asset: PLATFROM_ASSET,
    //     destination: creatorPub,
    //   }),
    // )
    // sending platform fee.
    // .addOperation(
    //   Operation.payment({
    //     amount: PLATFROM_FEE,
    //     asset: PLATFROM_ASSET,
    //     destination: maotherAcc.publicKey(),
    //   }),
    // )

    .setTimeout(0)
    .build();

  Tx1.sign(assetStorage, maotherAcc);
  return Tx1.toXDR();
}
