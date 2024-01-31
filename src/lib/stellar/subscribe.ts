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

const log = console;
// transection variables

export async function getClawbackAsPayment({
  userPubkey,
  asset,
}: {
  userPubkey: string;
  asset: Asset;
}) {
  try {
    const server = new Server(STELLAR_URL);

    const storageSecret = "vong cong";
    const storageAcc = Keypair.fromSecret(storageSecret);

    const transactionInializer = await server.loadAccount(userPubkey);

    const Tx1 = new TransactionBuilder(transactionInializer, {
      fee: "200",
      networkPassphrase,
    })

      // 0
      .addOperation(
        Operation.payment({
          destination: userPubkey,
          amount: "1",
          asset,
          source: storageAcc.publicKey(),
        }),
      )
      .setTimeout(0)
      .build();

    await Tx1.sign(storageAcc);

    return Tx1.toXDR();
  } catch (e) {
    log.info(e);
  }
}
