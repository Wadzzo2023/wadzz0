import {
  Asset,
  BASE_FEE,
  Keypair,
  Operation,
  Horizon,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { STELLAR_URL } from "../constant";
import { networkPassphrase } from "../constant";
import { SignUserType, WithSing } from "../../utils";
import { env } from "~/env";
import { PLATFORM_ASSET, PLATFORM_FEE } from "../../constant";
import { getplatformAssetNumberForXLM } from "../../fan/get_token_price";

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
  const server = new Horizon.Server(STELLAR_URL);

  const mother = Keypair.fromSecret(env.MOTHER_SECRET);

  const transactionInializer = await server.loadAccount(userPub);

  // check storage trust to token
  const storage = await server.loadAccount(storagePub);
  const balances = storage.balances;
  const trust = balances.find((balance) => {
    if (
      balance.asset_type === "credit_alphanum12" ||
      balance.asset_type === "credit_alphanum4"
    ) {
      if (
        balance.asset_code === assetCode &&
        balance.asset_issuer === issuerPub
      ) {
        return true;
      }
    }
  });

  let trxCharge = Number(PLATFORM_FEE);

  const Tx2 = new TransactionBuilder(transactionInializer, {
    fee: BASE_FEE,
    networkPassphrase,
  });

  if (trust === undefined) {
    // send required xlm to the storage acc.
    Tx2.addOperation(
      Operation.payment({
        amount: "0.5",
        asset: Asset.native(),
        destination: storagePub,
        source: mother.publicKey(),
      }),
    );

    const requiredAsset2refundXlm = await getplatformAssetNumberForXLM(0.5);
    trxCharge += requiredAsset2refundXlm;
  }

  Tx2.addOperation(
    Operation.payment({
      destination: mother.publicKey(),
      amount: trxCharge.toString(),
      asset: PLATFORM_ASSET,
    }),
  );
  // if storage don't have trust

  // make payment
  const buildTrx = Tx2.addOperation(
    Operation.payment({
      destination: storagePub,
      amount: assetAmount, //copy,
      asset: asset,
      source: userPub,
    }),
  )
    .setTimeout(0)
    .build();

  if (trust === undefined) {
    buildTrx.sign(mother);
  }

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

  const transactionInializer = await server.loadAccount(userPub);

  const Tx2 = new TransactionBuilder(transactionInializer, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    // add platform fee
    .addOperation(
      Operation.payment({
        destination: motherAcc.publicKey(),
        amount: PLATFORM_FEE,
        asset: PLATFORM_ASSET,
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
