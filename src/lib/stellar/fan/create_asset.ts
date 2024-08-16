import {
  Keypair,
  Operation,
  Horizon,
  TransactionBuilder,
  Asset,
} from "@stellar/stellar-sdk";
import {
  PLATFORM_ASSET,
  PLATFORM_FEE,
  STELLAR_URL,
  networkPassphrase,
} from "../constant";
import { env } from "~/env";
import { AccountSchema, AccountType } from "./utils";
import { SignUserType, WithSing } from "../utils";

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
  actionAmount,
  signWith,
}: {
  pubkey: string;
  code: string;
  limit: number;
  actionAmount: string;
  signWith: SignUserType;
}) {
  const limit = limitValue.toString();
  const server = new Horizon.Server(STELLAR_URL);

  // issuer
  const issuerAcc = Keypair.random();
  const distributorAcc = Keypair.fromSecret(env.STORAGE_SECRET);

  const asset = new Asset(code, issuerAcc.publicKey());

  const transactionInializer = await server.loadAccount(pubkey);

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  })
    // first get action for required xl.
    .addOperation(
      Operation.payment({
        destination: distributorAcc.publicKey(),
        asset: PLATFORM_ASSET,
        amount: actionAmount,
      }),
    )

    // send this required xlm
    .addOperation(
      Operation.payment({
        destination: pubkey,
        asset: Asset.native(),
        amount: "1.5",
        source: distributorAcc.publicKey(),
      }),
    )
    // create issuer account
    .addOperation(
      Operation.createAccount({
        destination: issuerAcc.publicKey(),
        startingBalance: "1.5",
      }),
    )
    //
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
    // sending platform fee.
    .addOperation(
      Operation.payment({
        amount: PLATFORM_FEE,
        asset: PLATFORM_ASSET,
        destination: distributorAcc.publicKey(),
      }),
    )
    // 5
    .setTimeout(0)
    .build();

  // sign
  Tx1.sign(issuerAcc, distributorAcc);
  const xdr = Tx1.toXDR();
  const signedXDr = await WithSing({
    xdr: xdr,
    signWith,
  });

  const issuer: AccountType = {
    publicKey: issuerAcc.publicKey(),
    secretKey: issuerAcc.secret(),
  };
  return { xdr: signedXDr, issuer };
}
