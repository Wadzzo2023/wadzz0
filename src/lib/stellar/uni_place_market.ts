import {
  Keypair,
  Operation,
  Server,
  TransactionBuilder,
  Asset,
} from "stellar-sdk";
import { STELLAR_URL, networkPassphrase } from "./fan/constant";
import { SignUserType, WithSing } from "./utils";

// transection variables

export async function PlaceUniAsset2Market({
  pubkey: actor,
  code,
  limit,
  issuer,
  signWith,
  storageSecret,
}: {
  pubkey: string;
  code: string;
  issuer: string;
  limit: string;
  actionAmount: string;
  storageSecret: string;
  signWith: SignUserType;
}) {
  const server = new Server(STELLAR_URL);

  const actionAmount = "40";
  // issuer
  const asesetStorage = Keypair.fromSecret(storageSecret);

  const asset = new Asset(code, issuer);

  const transactionInializer = await server.loadAccount(actor);

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
      Operation.payment({
        asset,
        amount: limit,
        destination: asesetStorage.publicKey(),
      }),
    )
    .setTimeout(0)
    .build();

  // sign
  Tx1.sign();

  const xdr = Tx1.toXDR();

  return await WithSing({
    xdr: xdr,
    signWith,
  });
}
