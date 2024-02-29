import {
  Keypair,
  Operation,
  Server,
  TransactionBuilder,
  Asset,
} from "stellar-sdk";
import {
  PLATFROM_ASSET,
  PLATFROM_FEE,
  STELLAR_URL,
  LOWEST_ASSET_AMOUNT,
  networkPassphrase,
} from "./constant";
import { env } from "~/env";
import { MyAssetType } from "./utils";

const log = console;

export async function buyAssetTrx({
  customerPubkey,
  assetType,
  creatorId,
  price,
}: {
  customerPubkey: string;
  assetType: MyAssetType;
  price: string;
  creatorId: string;
}) {
  const server = new Server(STELLAR_URL);
  const asset = new Asset(assetType.code, assetType.issuer);

  const distributorAcc = Keypair.fromSecret(env.DISTRIBUTOR_SECRET);

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

    // pay first

    // get payment
    .addOperation(
      Operation.payment({
        asset,
        amount: LOWEST_ASSET_AMOUNT,
        source: distributorAcc.publicKey(),
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
        destination: distributorAcc.publicKey(),
      }),
    )

    .setTimeout(0)
    .build();

  Tx1.sign(distributorAcc);
  return Tx1.toXDR();
}
