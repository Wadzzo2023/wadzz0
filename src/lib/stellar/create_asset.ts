import {
  Keypair,
  Operation,
  Server,
  TransactionBuilder,
  Asset,
} from "stellar-sdk";
import { STELLAR_URL, networkPassphrase } from "./constant";
import { env } from "~/env";
import { AccounSchema, AccountType } from "./utils";

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
  limit: limitValue,
}: {
  pubkey: string;
  code: string;
  limit: number;
}) {
  console.log(pubkey, "pubkey");
  const limit = limitValue.toString();
  const server = new Server(STELLAR_URL);

  // issuer
  const issuerAcc = Keypair.random();
  const distributorAcc = Keypair.fromSecret(env.DISTRIBUTOR_SECRET);

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
    // 2
    .addOperation(
      Operation.changeTrust({
        asset,
        limit: limit,
        source: distributorAcc.publicKey(),
      }),
    )
    // 3
    .addOperation(
      Operation.payment({
        asset,
        amount: limit,
        source: issuerAcc.publicKey(),
        destination: distributorAcc.publicKey(),
      }),
    )
    // 4
    .addOperation(
      Operation.setOptions({
        homeDomain: "vongcong.com",
        source: issuerAcc.publicKey(),
      }),
    )
    // 5
    .setTimeout(0)
    .build();

  Tx1.sign(issuerAcc, distributorAcc);
  const issuer: AccountType = {
    publicKey: issuerAcc.publicKey(),
    secretKey: issuerAcc.secret(),
  };
  return { xdr: Tx1.toXDR(), issuer };
}
