import {
  Asset,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { env } from "~/env";
import { SignUserType, WithSing } from "../utils";
import { PLATFROM_ASSET, STELLAR_URL, networkPassphrase } from "../constant";

export async function trustCustomPageAsset({
  creator,
  code,
  issuer,
  storageSecret,
  requiredPlatformAsset,
  signWith,
}: {
  creator: string;
  requiredPlatformAsset: string;
  code: string;
  issuer: string;
  storageSecret: string;
  signWith: SignUserType;
}) {
  const server = new Horizon.Server(STELLAR_URL);

  const asset = new Asset(code, issuer);

  // const motherAccount = Keypair.fromSecret(env.MOTHER_SECRET);
  const distributorAcc = Keypair.fromSecret(env.STORAGE_SECRET);
  const creatorStorageAcc = Keypair.fromSecret(storageSecret);

  const transactionInializer = await server.loadAccount(creator);

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  });

  Tx1.addOperation(
    Operation.payment({
      amount: requiredPlatformAsset,
      destination: distributorAcc.publicKey(),
      asset: PLATFROM_ASSET,
    }),
  )
    .addOperation(
      Operation.payment({
        amount: "0.5",
        asset: Asset.native(),
        destination: creatorStorageAcc.publicKey(),
        source: distributorAcc.publicKey(),
      }),
    )
    .addOperation(
      Operation.changeTrust({
        asset,
      }),
    )
    .setTimeout(0);

  const buildTrx = Tx1.build();
  buildTrx.sign(creatorStorageAcc, distributorAcc);

  const xdr = buildTrx.toXDR();

  const signedXDr = await WithSing({
    xdr: xdr,
    signWith: signWith,
  });

  return signedXDr;
}
