import {
  Asset,
  BASE_FEE,
  Keypair,
  Operation,
  Server,
  TransactionBuilder,
} from "stellar-sdk";
import { DEFAULT_ASSET_LIMIT, STELLAR_URL, STORAGE_SECRET } from "../constant";
import { networkPassphrase } from "./create_song_token";
import { SignUserType, WithSing } from "../../utils";
import { STROOP } from "../../marketplace/constant";

const log = console;

export async function XDR4BuyAsset({
  signWith,
  code,
  issuerPub,
  buyer,
  price,
  storageSecret,
  seller,
}: {
  buyer: string;
  code: string;
  issuerPub: string;
  price: string;
  signWith: SignUserType;
  storageSecret: string;
  seller: string;
}) {
  // this asset limit only for buying more item.

  const asset = new Asset(code, issuerPub);
  const server = new Server(STELLAR_URL);
  const storageAcc = Keypair.fromSecret(storageSecret);

  const transactionInializer = await server.loadAccount(buyer);

  const Tx2 = new TransactionBuilder(transactionInializer, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    //1
    .addOperation(
      Operation.payment({
        destination: seller,
        amount: price,
        asset: Asset.native(),
        source: buyer,
      }),
    )
    //2
    .addOperation(
      Operation.changeTrust({
        asset: asset,
        source: buyer,
      }),
    )
    // 3
    .addOperation(
      Operation.payment({
        asset: asset,
        amount: STROOP,
        source: storageAcc.publicKey(),
        destination: buyer,
      }),
    )
    .setTimeout(0)
    .build();

  Tx2.sign(storageAcc);

  const xdr = Tx2.toXDR();
  const singedXdr = WithSing({ xdr, signWith });
  return singedXdr;
}
