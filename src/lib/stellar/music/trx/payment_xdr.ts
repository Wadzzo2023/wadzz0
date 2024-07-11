import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { networkPassphrase } from "./create_song_token";
import { SignUserType, WithSing } from "../../utils";
import { STROOP } from "../../marketplace/constant";
import { PLATFROM_ASSET, PLATFROM_FEE, STELLAR_URL } from "../../constant";
import { env } from "~/env";

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
  const server = new Horizon.Server(STELLAR_URL);
  const storageAcc = Keypair.fromSecret(storageSecret);

  const transactionInializer = await server.loadAccount(buyer);

  const balances = transactionInializer.balances;
  const trust = balances.find((balance) => {
    if (
      balance.asset_type === "credit_alphanum12" ||
      balance.asset_type === "credit_alphanum4"
    ) {
      if (balance.asset_code === code && balance.asset_issuer === issuerPub) {
        return true;
      }
    }
  });

  const Tx2 = new TransactionBuilder(transactionInializer, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    // pay price to seller
    .addOperation(
      Operation.payment({
        destination: seller,
        amount: price,
        asset: PLATFROM_ASSET,
        source: buyer,
      }),
    );

  if (trust === undefined) {
    Tx2.addOperation(
      Operation.changeTrust({
        asset: asset,
        source: buyer,
      }),
    );
  }

  // send token to buyyer
  Tx2.addOperation(
    Operation.payment({
      asset: asset,
      amount: "1",
      source: storageAcc.publicKey(),
      destination: buyer,
    }),
  )

    // pay fee for platform
    .addOperation(
      Operation.payment({
        asset: PLATFROM_ASSET,
        amount: PLATFROM_FEE,
        destination: Keypair.fromSecret(env.MOTHER_SECRET).publicKey(),
      }),
    )
    .setTimeout(0);

  const buildTrx = Tx2.build();

  buildTrx.sign(storageAcc);

  const xdr = buildTrx.toXDR();
  const singedXdr = WithSing({ xdr, signWith });
  // console.log(singedXdr, "singedXdr");
  return singedXdr;
}
