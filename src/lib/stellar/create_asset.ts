import {
  Keypair,
  Operation,
  Server,
  TransactionBuilder,
  Asset,
} from "stellar-sdk";
import { STELLAR_URL, networkPassphrase } from "./constant";

const log = console;

// transection variables

export type trxResponse = {
  successful: boolean;
  issuerAcc: { pub: string; secret: string };
  distributorSecret: string;
  ipfsHash: string;
  error?: { status: number; msg: string };
};

export async function createAsset({
  pubkey,
  code,
}: {
  pubkey: string;
  code: string;
}) {
  try {
    const limit = "5000";
    const server = new Server(STELLAR_URL);

    // issuer
    const issuerAcc = Keypair.random();

    const asset = new Asset(code, issuerAcc.publicKey());

    const transactionInializer = await server.loadAccount(pubkey);

    const Tx1 = new TransactionBuilder(transactionInializer, {
      fee: "200",
      networkPassphrase,
    })
      // 0 create issuer account
      .addOperation(
        Operation.createAccount({
          destination: issuerAcc.publicKey(),
          startingBalance: "1.5",
        }),
      )
      // 1
      .addOperation(
        Operation.changeTrust({
          asset,
          limit: limit,
        }),
      )
      // 3
      .addOperation(
        Operation.payment({
          asset,
          amount: limit,
          source: issuerAcc.publicKey(),
          destination: pubkey,
        }),
      )
      // 4
      .addOperation(
        Operation.manageData({
          name: "ipfshash",
          value: "test",
          source: issuerAcc.publicKey(),
        }),
      )
      // 5
      .setTimeout(0)
      .build();

    await Tx1.sign(issuerAcc);
    return Tx1.toXDR();
  } catch (e) {
    log.info(e);
  }
}
