import {
  Asset,
  BASE_FEE,
  Keypair,
  Operation,
  Server,
  TransactionBuilder,
} from "stellar-sdk";
import { STELLAR_URL } from "../constant";
import { networkPassphrase } from "../constant";
import { SignUserType, WithSing } from "../../utils";
import { env } from "~/env";
import { PLATFROM_ASSET, PLATFROM_FEE } from "../../fan/constant";

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
    .addOperation(
      Operation.payment({
        destination: Keypair.fromSecret(env.MOTHER_SECRET).publicKey(),
        amount: PLATFROM_FEE,
        asset: PLATFROM_ASSET,
      }),
    )
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
  const motherAcc = Keypair.fromSecret(env.MOTHER_SECRET);

  const server = new Server(STELLAR_URL);

  const transactionInializer = await server.loadAccount(userPub);

  const Tx2 = new TransactionBuilder(transactionInializer, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    // add platform fee
    .addOperation(
      Operation.payment({
        destination: motherAcc.publicKey(),
        amount: PLATFROM_FEE,
        asset: PLATFROM_ASSET,
      }),
    )
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
