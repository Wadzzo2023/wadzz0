import {
  Asset,
  BASE_FEE,
  Keypair,
  Operation,
  Server,
  TransactionBuilder,
} from "stellar-sdk";
import log from "~/lib/logger/logger";
import { STROOP, STELLAR_URL } from "../constant";
import { STORAGE_SECRET } from "../SECRET";
import { networkPassphrase } from "../constant";
import { getPrice } from "./utils";
import { SignUserType, WithSing } from "../../utils";

export async function sendNft2StorageXDR({
  assetCode,
  issuerPub,
  assetAmount,
  userPub,
  storagePub,
  signWith,
}: {
  userPub: string;
  storagePub: string;
  assetCode: string;
  issuerPub: string;
  assetAmount: string;
  signWith: SignUserType;
}) {
  // const assetAmount = DEFAULT_ASSET_LIMIT
  const asset = new Asset(assetCode, issuerPub);
  const server = new Server(STELLAR_URL);

  const transactionInializer = await server.loadAccount(userPub);

  const Tx2 = new TransactionBuilder(transactionInializer, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    //
    .addOperation(
      Operation.payment({
        destination: storagePub,
        amount: assetAmount, //copy,
        asset: asset,
        source: userPub,
      }),
    )
    .setTimeout(0)
    .build();

  return await WithSing({ xdr: Tx2.toXDR(), signWith });
}

export async function sendNftback({
  assetCode,
  issuerPub,
  assetAmount,
  userPub,
  storageSecret,
  signWith,
}: {
  userPub: string;
  storageSecret: string;
  assetCode: string;
  issuerPub: string;
  assetAmount: string;
  signWith: SignUserType;
}) {
  // const assetAmount = DEFAULT_ASSET_LIMIT
  const asset = new Asset(assetCode, issuerPub);
  const storageAcc = Keypair.fromSecret(storageSecret);
  const server = new Server(STELLAR_URL);

  const transactionInializer = await server.loadAccount(userPub);

  const Tx2 = new TransactionBuilder(transactionInializer, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    //
    .addOperation(
      Operation.payment({
        destination: userPub,
        amount: assetAmount, //copy,
        asset: asset,
        source: storageAcc.publicKey(),
      }),
    )
    .setTimeout(0)
    .build();

  Tx2.sign(storageAcc);

  return await WithSing({ xdr: Tx2.toXDR(), signWith });
}
