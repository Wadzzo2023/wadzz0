import {
  BASE_FEE,
  Keypair,
  Operation,
  Server,
  Networks,
  TransactionBuilder,
  Asset,
  AuthClawbackEnabledFlag,
  AuthRevocableFlag,
} from "stellar-sdk";
import { env } from "~/env";
import { STELLAR_URL, networkPassphrase } from "./constant";

// transection variables

export async function clawBackAccCreate({
  pubkey,
  assetCode,
}: {
  pubkey: string;
  assetCode: string;
}) {
  try {
    const server = new Server(STELLAR_URL);

    const storageSecret = "vong cong";
    const storageAcc = Keypair.fromSecret(storageSecret);

    const escrowAcc = Keypair.random();
    const asset = new Asset(assetCode, escrowAcc.publicKey());

    const transactionInializer = await server.loadAccount(pubkey);
    const limit = "50000";

    const Tx1 = new TransactionBuilder(transactionInializer, {
      fee: "200",
      networkPassphrase,
    })

      // 0
      .addOperation(
        Operation.createAccount({
          destination: escrowAcc.publicKey(),
          startingBalance: "1.5",
          source: pubkey,
        }),
      )
      // 1 escrow acc setting his auth clawbackflag.
      .addOperation(
        Operation.setOptions({
          homeDomain: "test.com",
          setFlags: AuthClawbackEnabledFlag,
          source: escrowAcc.publicKey(),
        }),
      )
      // 2 storage changing trust.
      .addOperation(
        Operation.changeTrust({
          asset,
          limit,
          source: storageAcc.publicKey(),
        }),
      )
      // 3
      .addOperation(
        Operation.payment({
          asset: asset,
          amount: limit,
          source: escrowAcc.publicKey(),
          destination: storageAcc.publicKey(),
        }),
      )
      .setTimeout(0)
      .build();

    await Tx1.sign(escrowAcc);

    return Tx1.toXDR();
  } catch (e) {
    console.info(e);
    return "vongcong";
  }
}
