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
  networkPassphrase,
} from "./fan/constant";
import { env } from "~/env";
import { AccountSchema, AccountType } from "./fan/utils";
import { SignUserType, WithSing } from "./utils";

const log = console;

// transection variables

export async function createUniAsset({
  pubkey,
  code,
  limit,
  signWith,
  homeDomain,
  storageSecret,
}: {
  pubkey: string;
  code: string;
  limit: string;
  actionAmount: string;
  storageSecret: string;
  signWith: SignUserType;
  homeDomain: string;
}) {
  const server = new Server(STELLAR_URL);

  const actionAmount = "40";
  // issuer
  const issuerAcc = Keypair.random();
  const asesetStorage = Keypair.fromSecret(storageSecret);

  const asset = new Asset(code, issuerAcc.publicKey());

  const transactionInializer = await server.loadAccount(pubkey);

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  })
    // // first get action for required xl. and fee.
    // .addOperation(
    //   Operation.payment({
    //     destination: distributorAcc.publicKey(),
    //     asset: PLATFROM_ASSET,
    //     amount: actionAmount,
    //   }),
    // )

    // // send this required xlm
    // .addOperation(
    //   Operation.payment({
    //     destination: pubkey,
    //     asset: Asset.native(),
    //     amount: "1.5",
    //     source: distributorAcc.publicKey(),
    //   }),
    // )
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
        source: asesetStorage.publicKey(),
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
      Operation.setOptions({
        homeDomain,
        source: issuerAcc.publicKey(),
      }),
    )

    .setTimeout(0)
    .build();

  // sign
  Tx1.sign(issuerAcc, asesetStorage); //TODO add distributorStorage
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
