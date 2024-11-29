import {
  Asset,
  Keypair,
  Horizon,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { env } from "~/env";
import { SignUserType, WithSing } from "../utils";
import {
  PLATFORM_ASSET,
  PLATFORM_FEE,
  STELLAR_URL,
  TrxBaseFee,
  TrxBaseFeeInPlatformAsset,
  networkPassphrase,
} from "../constant";
import { getplatformAssetNumberForXLM } from "./get_token_price";
import { AccountType } from "./utils";

// transaction variables

export async function creatorPageAccCreate({
  limit,
  pubkey,
  assetCode,
  signWith,
  storageSecret,
  ipfs,
}: {
  limit: string;
  pubkey: string;
  assetCode: string;
  signWith: SignUserType;
  ipfs: string;
  storageSecret: string;
}) {
  const server = new Horizon.Server(STELLAR_URL);

  const requiredAsset2refundXlm = await getplatformAssetNumberForXLM(2);
  const total =
    requiredAsset2refundXlm +
    Number(PLATFORM_FEE) +
    Number(TrxBaseFeeInPlatformAsset);

  const storageAcc = Keypair.fromSecret(storageSecret);
  const PLATFORM_MOTHER_ACC = Keypair.fromSecret(env.MOTHER_SECRET);

  const issuerAcc = Keypair.random();
  const asset = new Asset(assetCode, issuerAcc.publicKey());

  const transactionInializer = await server.loadAccount(
    PLATFORM_MOTHER_ACC.publicKey(),
  );

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: TrxBaseFee,
    networkPassphrase,
  })
    // first get action for required xlm. and platformFee
    .addOperation(
      Operation.payment({
        destination: PLATFORM_MOTHER_ACC.publicKey(),
        asset: PLATFORM_ASSET,
        amount: total.toString(),
        source: pubkey,
      }),
    )

    // send this required xlm to storage so that it can lock new  trusting asset (0.5xlm)
    .addOperation(
      Operation.payment({
        destination: storageAcc.publicKey(),
        asset: Asset.native(),
        amount: "2",
        source: PLATFORM_MOTHER_ACC.publicKey(),
      }),
    )

    // create issuer acc
    .addOperation(
      Operation.createAccount({
        destination: issuerAcc.publicKey(),
        startingBalance: "1.5",
        source: storageAcc.publicKey(),
      }),
    )
    // 1 escrow acc setting his auth clawbackflag.
    .addOperation(
      Operation.setOptions({
        homeDomain: env.NEXT_PUBLIC_HOME_DOMAIN,
        source: issuerAcc.publicKey(),
      }),
    )
    .addOperation(
      Operation.manageData({
        name: "ipfs",
        value: ipfs,
        source: issuerAcc.publicKey(),
      }),
    )

    // 2 storage changing trust.
    .addOperation(
      Operation.changeTrust({
        asset,
        source: storageAcc.publicKey(),
      }),
    )
    // 3
    .addOperation(
      Operation.payment({
        asset: asset,
        amount: limit,
        source: issuerAcc.publicKey(),
        destination: storageAcc.publicKey(),
      }),
    )

    .setTimeout(0)
    .build();

  // sign
  Tx1.sign(issuerAcc, storageAcc, PLATFORM_MOTHER_ACC);

  // fab and google user sing
  const trx = Tx1.toXDR();
  const signedXDr = await WithSing({ xdr: trx, signWith });

  const escrow: AccountType = {
    publicKey: issuerAcc.publicKey(),
    secretKey: issuerAcc.secret(),
  };

  return { trx: signedXDr, escrow };
}

export async function creatorPageAccCreateWithXLM({
  limit,
  pubkey,
  assetCode,
  signWith,
  storageSecret,
  ipfs,
}: {
  limit: string;
  pubkey: string;
  assetCode: string;
  signWith: SignUserType;
  ipfs: string;
  storageSecret: string;
}) {
  const server = new Horizon.Server(STELLAR_URL);

  const storageAcc = Keypair.fromSecret(storageSecret);
  const PLATFORM_MOTHER_ACC = Keypair.fromSecret(env.MOTHER_SECRET);

  const issuerAcc = Keypair.random();
  const asset = new Asset(assetCode, issuerAcc.publicKey());

  const transactionInitializer = await server.loadAccount(pubkey);

  const Tx1 = new TransactionBuilder(transactionInitializer, {
    fee: TrxBaseFee,
    networkPassphrase,
  })
    // get fee
    .addOperation(
      Operation.payment({
        destination: PLATFORM_MOTHER_ACC.publicKey(),
        asset: Asset.native(),
        amount: "2",
      }),
    )

    .addOperation(
      Operation.payment({
        destination: storageAcc.publicKey(),
        asset: Asset.native(),
        amount: "2",
      }),
    )

    // create issuer acc
    .addOperation(
      Operation.createAccount({
        destination: issuerAcc.publicKey(),
        startingBalance: "1.5",
        source: storageAcc.publicKey(),
      }),
    )
    .addOperation(
      Operation.setOptions({
        homeDomain: env.NEXT_PUBLIC_HOME_DOMAIN,
        source: issuerAcc.publicKey(),
      }),
    )
    .addOperation(
      Operation.manageData({
        name: "ipfs",
        value: ipfs,
        source: issuerAcc.publicKey(),
      }),
    )

    // 2 storage changing trust.
    .addOperation(
      Operation.changeTrust({
        asset,
        source: storageAcc.publicKey(),
      }),
    )
    // 3
    .addOperation(
      Operation.payment({
        asset: asset,
        amount: limit,
        source: issuerAcc.publicKey(),
        destination: storageAcc.publicKey(),
      }),
    )

    .setTimeout(0)
    .build();

  // sign
  Tx1.sign(issuerAcc, storageAcc);

  // fab and google user sing
  const trx = Tx1.toXDR();
  const signedXDr = await WithSing({ xdr: trx, signWith });

  const escrow: AccountType = {
    publicKey: issuerAcc.publicKey(),
    secretKey: issuerAcc.secret(),
  };

  return { trx: signedXDr, escrow };
}
