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
  userPub,
  price,
  limit,
  storageSecret,
  creatorPub,
}: {
  userPub: string;
  code: string;
  issuerPub: string;
  price: string;
  limit: string;
  signWith: SignUserType;
  storageSecret: string;
  creatorPub: string;
}) {
  // this asset limit only for buying more item.

  const asset = new Asset(code, issuerPub);
  const server = new Server(STELLAR_URL);
  const storageAcc = Keypair.fromSecret(storageSecret);

  const transactionInializer = await server.loadAccount(userPub);

  const Tx2 = new TransactionBuilder(transactionInializer, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    //1
    .addOperation(
      Operation.payment({
        destination: creatorPub,
        amount: price,
        asset: Asset.native(),
        source: userPub,
      }),
    )
    //2
    .addOperation(
      Operation.changeTrust({
        asset: asset,
        source: userPub,
      }),
    )
    // 3
    .addOperation(
      Operation.payment({
        asset: asset,
        amount: STROOP,
        source: storageAcc.publicKey(),
        destination: userPub,
      }),
    )
    .setTimeout(0)
    .build();

  Tx2.sign(storageAcc);

  const xdr = Tx2.toXDR();
  const singedXdr = WithSing({ xdr, signWith });
  return singedXdr;
}
