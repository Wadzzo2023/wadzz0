import {
  Keypair,
  Operation,
  Server,
  TransactionBuilder,
  Asset,
} from "stellar-sdk";
import { STELLAR_URL, networkPassphrase } from "./constant";
import { env } from "~/env";

const log = console;

export async function buyAssetTrx({
  customerPubkey,
  asset,
}: {
  customerPubkey: string;
  asset: Asset;
}) {
  const server = new Server(STELLAR_URL);

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
        amount: "1",
        source: distributorAcc.publicKey(),
        destination: customerPubkey,
      }),
    )

    .setTimeout(0)
    .build();

  await Tx1.sign(distributorAcc);
  return Tx1.toXDR();
}
