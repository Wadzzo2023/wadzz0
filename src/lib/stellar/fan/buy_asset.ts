import {
  Asset,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { env } from "~/env";
import {
  PLATFORM_ASSET,
  PLATFORM_FEE,
  STELLAR_URL,
  networkPassphrase,
} from "../constant";
import { MyAssetType } from "./utils";

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
  const motherAcc = Keypair.fromSecret(env.MOTHER_SECRET);

  const transactionInitializer = await server.loadAccount(customerPubkey);

  const Tx1 = new TransactionBuilder(transactionInitializer, {
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
        amount: "1",
        source: assetStorage.publicKey(),
        destination: customerPubkey,
      }),
    )
    // pay the creator the price amount
    .addOperation(
      Operation.payment({
        amount: price,
        asset: PLATFORM_ASSET,
        destination: creatorId,
      }),
    )
    // sending platform fee.
    .addOperation(
      Operation.payment({
        amount: PLATFORM_FEE,
        asset: PLATFORM_ASSET,
        destination: motherAcc.publicKey(),
      }),
    )

    .setTimeout(0)
    .build();

  Tx1.sign(assetStorage);
  return Tx1.toXDR();
}
