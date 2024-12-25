import {
  Asset,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { env } from "~/env";
import {
  PLATFORM_ASSET,
  PLATFORM_FEE,
  STELLAR_URL,
  TrxBaseFee,
  TrxBaseFeeInPlatformAsset,
  networkPassphrase,
} from "../constant";
import { SignUserType, WithSing } from "../utils";
import { P } from "pino";
import { getplatformAssetNumberForXLM } from "./get_token_price";

export async function createRedeemXDRAsset({
  creatorId,
  signWith,
  maxRedeems,
}: {
  creatorId: string;
  maxRedeems: number;
  signWith: SignUserType;
}) {
  const server = new Horizon.Server(STELLAR_URL);

  const motherAccount = Keypair.fromSecret(env.MOTHER_SECRET);

  const transactionInializer = await server.loadAccount(
    motherAccount.publicKey(),
  );

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: TrxBaseFee,
    networkPassphrase,
  });

  // (0.5 xlm + trxBaseFee + platformFee ) * maxRedeems
  const trustPrice = await getplatformAssetNumberForXLM(0.5);
  const totalAmount =
    Number(trustPrice + Number(TrxBaseFeeInPlatformAsset) + Number(PLATFORM_FEE)) * maxRedeems;

  Tx1.addOperation(
    Operation.payment({
      destination: motherAccount.publicKey(),
      asset: PLATFORM_ASSET,
      amount: totalAmount.toFixed(7),
      source: creatorId,
    }),
  );
  Tx1.setTimeout(0);

  const buildTrx = Tx1.build();
  buildTrx.sign(motherAccount);
  const xdr = buildTrx.toXDR();

  const singedXdr = WithSing({ xdr, signWith });

  return singedXdr;
}

export async function createRedeemXDRNative({
  creatorId,
  signWith,
  maxRedeems,
}: {
  creatorId: string;
  maxRedeems: number;
  signWith: SignUserType;
}) {
  const server = new Horizon.Server(STELLAR_URL);

  const motherAccount = Keypair.fromSecret(env.MOTHER_SECRET);

  const trustPrice = 0.5;
  const xlmPlatformFee = 2;
  const amount = Number(trustPrice + TrxBaseFee) * maxRedeems + xlmPlatformFee;

  const transactionInializer = await server.loadAccount(
    motherAccount.publicKey(),
  );
  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: TrxBaseFee,
    networkPassphrase,
  });

  Tx1.addOperation(
    Operation.payment({
      destination: motherAccount.publicKey(),
      asset: Asset.native(),
      amount: amount.toFixed(7),
      source: creatorId,
    }),
  );

  Tx1.setTimeout(0);
  const buildTrx = Tx1.build();

  buildTrx.sign(motherAccount);
  const xdr = buildTrx.toXDR();

  const singedXdr = WithSing({ xdr, signWith });

  return singedXdr;
}

export async function claimRedeemXDR({
  creatorId,
  signWith,
  assetCode,
  assetIssuer,
  userPub,
  storageSecret,
}: {
  creatorId: string;
  assetIssuer: string;
  assetCode: string;
  signWith: SignUserType;
  userPub: string;
  storageSecret: string;
}) {
  const server = new Horizon.Server(STELLAR_URL);

  const asset = new Asset(assetCode, assetIssuer);

  const motherAccount = Keypair.fromSecret(env.MOTHER_SECRET);

  const assetStorage = Keypair.fromSecret(storageSecret);

  const transactionInializer = await server.loadAccount(
    motherAccount.publicKey(),
  );

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: TrxBaseFee,
    networkPassphrase,
  });

  // here total cost = 0.5 xlm + trxBaseFee

  Tx1.addOperation(
    Operation.payment({
      destination: userPub,
      asset: Asset.native(),
      amount: "0.5",
    }),
  )
    .addOperation(
      Operation.changeTrust({
        asset: asset,
        source: userPub,
      }),
    )
    .addOperation(
      Operation.payment({
        destination: userPub,
        asset: asset,
        amount: "1",
        source: assetStorage.publicKey(),
      }),
    );

  Tx1.setTimeout(0);
  const buildTrx = Tx1.build();

  buildTrx.sign(motherAccount, assetStorage);

  const xdr = buildTrx.toXDR();
  const singedXdr = WithSing({ xdr, signWith });

  return singedXdr;
}
