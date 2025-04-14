import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { env } from "~/env";
import {
  networkPassphrase,
  PLATFORM_ASSET,
  PLATFORM_FEE,
  STELLAR_URL,
  TrxBaseFee,
  TrxBaseFeeInPlatformAsset,
} from "../../constant";
import { getplatformAssetNumberForXLM } from "../../fan/get_token_price";
import { SignUserType, WithSing } from "../../utils";
import { StellarAccount } from "../test/Account";

export async function sendNft2StorageXDR({
  assetCode,
  issuerPub,
  assetAmount,
  userPub,
  storageSec,
  signWith,
}: {
  userPub: string;
  storageSec: string;
  assetCode: string;
  issuerPub: string;
  assetAmount: string;
  signWith: SignUserType;
}) {
  // const assetAmount = DEFAULT_ASSET_LIMIT
  const asset = new Asset(assetCode, issuerPub);
  const server = new Horizon.Server(STELLAR_URL);
  const motherAcc = Keypair.fromSecret(env.MOTHER_SECRET);
  const storageAcc = Keypair.fromSecret(storageSec);

  const transactionInitializer = await server.loadAccount(
    motherAcc.publicKey(),
  );

  const acc = await StellarAccount.create(storageAcc.publicKey());
  const hasTrust = acc.hasTrustline(asset.code, asset.issuer);

  const totalFee =
    Number(PLATFORM_FEE) +
    Number(TrxBaseFeeInPlatformAsset) +
    (hasTrust ? 0 : await getplatformAssetNumberForXLM(0.5));

  const Tx2 = new TransactionBuilder(transactionInitializer, {
    fee: TrxBaseFee,
    networkPassphrase,
  });

  if (!hasTrust) {
    Tx2.addOperation(
      Operation.payment({
        destination: storageAcc.publicKey(),
        amount: "0.5",
        asset: Asset.native(),
      }),
    ).addOperation(
      Operation.changeTrust({
        asset: asset,
        source: storageAcc.publicKey(),
      }),
    );
  }

  Tx2.addOperation(
    Operation.payment({
      destination: motherAcc.publicKey(),
      amount: totalFee.toFixed(7),
      asset: PLATFORM_ASSET,
    }),
  )
    //
    .addOperation(
      Operation.payment({
        destination: storageAcc.publicKey(),
        amount: assetAmount, //copy,
        asset: asset,
        source: userPub,
      }),
    )
    .setTimeout(0);

  const buildTrx = Tx2.build();

  buildTrx.sign(motherAcc, storageAcc);

  return await WithSing({ xdr: buildTrx.toXDR(), signWith });
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

  const server = new Horizon.Server(STELLAR_URL);

  const userAcc = await StellarAccount.create(userPub);
  const hasTrust = userAcc.hasTrustline(assetCode, issuerPub);

  const totalFee =
    Number(TrxBaseFeeInPlatformAsset) +
    Number(PLATFORM_FEE) +
    (hasTrust ? 0 : await getplatformAssetNumberForXLM(0.5));

  const transactionInializer = await server.loadAccount(motherAcc.publicKey());

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    // add platform fee
    .addOperation(
      Operation.payment({
        destination: motherAcc.publicKey(),
        amount: totalFee.toFixed(7),
        asset: PLATFORM_ASSET,
        source: userPub,
      }),
    );

  if (!hasTrust) {
    Tx1.addOperation(
      Operation.payment({
        amount: "0.5",
        asset: Asset.native(),
        destination: userPub,
      }),
    ).addOperation(
      Operation.changeTrust({
        asset: asset,
        source: userPub,
      }),
    );
  }

  Tx1.addOperation(
    Operation.payment({
      destination: userPub,
      amount: assetAmount, //copy,
      asset: asset,
      source: storageAcc.publicKey(),
    }),
  ).setTimeout(0);

  const Tx2 = Tx1.build();

  Tx2.sign(storageAcc, motherAcc);

  return await WithSing({ xdr: Tx2.toXDR(), signWith });
}
