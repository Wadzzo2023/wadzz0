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
} from "./constant";
import { getplatformAssetNumberForXLM } from "./fan/get_token_price";
import { AccountType } from "./fan/utils";
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
  ipfsHash,
}: {
  pubkey: string;
  code: string;
  limit: string;
  actionAmount: string;
  storageSecret: string;
  signWith: SignUserType;
  homeDomain: string;
  ipfsHash: string;
}) {
  const server = new Horizon.Server(STELLAR_URL);

  // accounts
  const issuerAcc = Keypair.random();
  const assetStorage = Keypair.fromSecret(storageSecret);
  const PLATFORM_MOTHER_ACC = Keypair.fromSecret(env.MOTHER_SECRET);

  const asset = new Asset(code, issuerAcc.publicKey());

  // get total platform token
  const requiredAsset2refundXlm = await getplatformAssetNumberForXLM(2);
  const total =
    requiredAsset2refundXlm +
    Number(PLATFORM_FEE) +
    Number(TrxBaseFeeInPlatformAsset);

  // here pubkey should be change for admin
  const transactionInitializer = await server.loadAccount(
    PLATFORM_MOTHER_ACC.publicKey(),
  );

  const Tx1 = new TransactionBuilder(transactionInitializer, {
    fee: TrxBaseFee,
    networkPassphrase,
  });

  // is admin is not creating the trx
  // console.log(signWith, "signWith");
  if (signWith === undefined || (signWith && !("isAdmin" in signWith))) {
    // first get action for required xlm. and platformFee
    Tx1.addOperation(
      Operation.payment({
        destination: PLATFORM_MOTHER_ACC.publicKey(),
        asset: PLATFORM_ASSET,
        amount: total.toString(),
        source: pubkey,
      }),
    );
  }

  // send this required xlm to storage so that it can lock new  trusting asset (0.5xlm)
  Tx1.addOperation(
    Operation.payment({
      destination: assetStorage.publicKey(),
      asset: Asset.native(),
      amount: "2",
      source: PLATFORM_MOTHER_ACC.publicKey(),
    }),
  )

    // create issuer account
    .addOperation(
      Operation.createAccount({
        destination: issuerAcc.publicKey(),
        startingBalance: "1.5",
        source: assetStorage.publicKey(),
      }),
    )
    // 2
    .addOperation(
      Operation.changeTrust({
        asset,
        limit: limit,
        source: assetStorage.publicKey(),
      }),
    )

    // 3
    .addOperation(
      Operation.payment({
        asset,
        amount: limit,
        source: issuerAcc.publicKey(),
        destination: assetStorage.publicKey(),
      }),
    )
    // 4
    .addOperation(
      Operation.setOptions({
        homeDomain,
        source: issuerAcc.publicKey(),
      }),
    )
    .addOperation(
      Operation.manageData({
        name: "ipfshash",
        value: ipfsHash,
        source: issuerAcc.publicKey(),
      }),
    )

    .setTimeout(0);

  const buildTrx = Tx1.build();

  // sign
  buildTrx.sign(PLATFORM_MOTHER_ACC, issuerAcc, assetStorage);
  const xdr = buildTrx.toXDR();

  const signedXDr = await WithSing({
    xdr: xdr,
    signWith: signWith && "isAdmin" in signWith ? undefined : signWith,
  });

  const issuer: AccountType = {
    publicKey: issuerAcc.publicKey(),
    secretKey: issuerAcc.secret(),
  };

  return { xdr: signedXDr, issuer };
}

export async function createUniAssetWithXLM({
  pubkey,
  code,
  limit,
  signWith,
  homeDomain,
  storageSecret,
  ipfsHash,
}: {
  pubkey: string;
  code: string;
  limit: string;
  actionAmount: string;
  storageSecret: string;
  signWith: SignUserType;
  homeDomain: string;
  ipfsHash: string;
}) {
  const server = new Horizon.Server(STELLAR_URL);

  // accounts
  const issuerAcc = Keypair.random();
  const asesetStorage = Keypair.fromSecret(storageSecret);
  const PLATFORM_MOTHER_ACC = Keypair.fromSecret(env.MOTHER_SECRET);

  const asset = new Asset(code, issuerAcc.publicKey());

  // here pubkey should be change for admin
  const transactionInitializer = await server.loadAccount(pubkey);

  const Tx1 = new TransactionBuilder(transactionInitializer, {
    fee: TrxBaseFee,
    networkPassphrase,
  });

  // is admin is not creating the trx
  if (signWith === undefined || (signWith && !("isAdmin" in signWith))) {
    // first get action for required xlm. and platformFee
    Tx1.addOperation(
      Operation.payment({
        destination: PLATFORM_MOTHER_ACC.publicKey(),
        asset: Asset.native(),
        amount: "2",
      }),
    );
  }

  // send this required xlm to storage so that it can lock new  trusting asset (0.5xlm)
  Tx1.addOperation(
    Operation.payment({
      destination: asesetStorage.publicKey(),
      asset: Asset.native(),
      amount: "2",
    }),
  )
    // create issuer account
    .addOperation(
      Operation.createAccount({
        destination: issuerAcc.publicKey(),
        startingBalance: "1.5",
        source: asesetStorage.publicKey(),
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
        destination: asesetStorage.publicKey(),
      }),
    )
    // 4
    .addOperation(
      Operation.setOptions({
        homeDomain,
        source: issuerAcc.publicKey(),
      }),
    )
    .addOperation(
      Operation.manageData({
        name: "ipfshash",
        value: ipfsHash,
        source: issuerAcc.publicKey(),
      }),
    )

    .setTimeout(0);

  const buildTrx = Tx1.build();

  // sign
  buildTrx.sign(issuerAcc, asesetStorage);
  const xdr = buildTrx.toXDR();

  const signedXDr = await WithSing({
    xdr: xdr,
    signWith: signWith && "isAdmin" in signWith ? undefined : signWith,
  });

  const issuer: AccountType = {
    publicKey: issuerAcc.publicKey(),
    secretKey: issuerAcc.secret(),
  };

  return { xdr: signedXDr, issuer };
}
