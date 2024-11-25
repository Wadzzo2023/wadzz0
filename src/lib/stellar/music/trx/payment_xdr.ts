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
import {
  PLATFORM_ASSET,
  PLATFORM_FEE,
  STELLAR_URL,
  TrxBaseFee,
  TrxBaseFeeInPlatformAsset,
} from "../../constant";
import { env } from "~/env";
import { StellarAccount } from "../../marketplace/test/Account";
import { b } from "vitest/dist/suite-IbNSsUWN";
import { getplatformAssetNumberForXLM } from "../../fan/get_token_price";

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

  const motherAcc = Keypair.fromSecret(env.MOTHER_SECRET);

  const transactionInializer = await server.loadAccount(motherAcc.publicKey());

  const buyerAcc = await StellarAccount.create(buyer);
  const hasTrust = buyerAcc.hasTrustline(code, issuerPub);

  const requiredAsset2refundXlm = hasTrust
    ? 0
    : await getplatformAssetNumberForXLM(0.5);
  const totalPlatformFee =
    requiredAsset2refundXlm +
    Number(PLATFORM_FEE) +
    Number(TrxBaseFeeInPlatformAsset);

  const Tx2 = new TransactionBuilder(transactionInializer, {
    fee: TrxBaseFee,
    networkPassphrase,
  });

  Tx2.addOperation(
    Operation.payment({
      destination: motherAcc.publicKey(),
      amount: totalPlatformFee.toString(),
      asset: PLATFORM_ASSET,
      source: buyer,
    }),
  );

  // pay price to seller
  if (Number(price) > 0) {
    Tx2.addOperation(
      Operation.payment({
        destination: seller,
        amount: price,
        asset: PLATFORM_ASSET,
        source: buyer,
      }),
    );
  }

  if (!hasTrust) {
    Tx2.addOperation(
      Operation.payment({
        destination: buyer,
        amount: "0.5",
        asset: Asset.native(),
        source: motherAcc.publicKey(),
      }),
    ).addOperation(
      Operation.changeTrust({
        asset: asset,
        source: buyer,
      }),
    );
  }

  // send token to buyer
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
        asset: PLATFORM_ASSET,
        amount: PLATFORM_FEE,
        destination: Keypair.fromSecret(env.MOTHER_SECRET).publicKey(),
      }),
    )
    .setTimeout(0);

  const buildTrx = Tx2.build();

  buildTrx.sign(motherAcc, storageAcc);

  const xdr = buildTrx.toXDR();
  const singedXdr = WithSing({ xdr, signWith });
  return singedXdr;
}

export async function XDR4BuyAssetWithXLM({
  signWith,
  code,
  issuerPub,
  buyer,
  priceInNative,
  storageSecret,
  seller,
}: {
  buyer: string;
  code: string;
  issuerPub: string;
  priceInNative: string;
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
    fee: TrxBaseFee,
    networkPassphrase,
  });

  if (Number(priceInNative) > 0) {
    // pay price to seller
    Tx2.addOperation(
      Operation.payment({
        destination: seller,
        amount: priceInNative,
        asset: Asset.native(),
        source: buyer,
      }),
    );
  }

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
        asset: Asset.native(),
        amount: "2",
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

export async function XDR4BuyAssetWithSquire({
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

  const mother = Keypair.fromSecret(env.MOTHER_SECRET);

  const transactionInializer = await server.loadAccount(mother.publicKey());

  const buyerAcc = await StellarAccount.create(buyer);
  const hasTrust = buyerAcc.hasTrustline(code, issuerPub);

  const Tx2 = new TransactionBuilder(transactionInializer, {
    fee: BASE_FEE,
    networkPassphrase,
  });

  if (Number(price) > 0) {
    Tx2
      // pay price to seller
      .addOperation(
        Operation.payment({
          destination: seller,
          amount: price,
          asset: PLATFORM_ASSET,
        }),
      );
  }

  if (!hasTrust) {
    Tx2.addOperation(
      Operation.payment({
        destination: buyer,
        amount: "0.5",
        asset: Asset.native(),
      }),
    );
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

    .setTimeout(0);

  const buildTrx = Tx2.build();

  buildTrx.sign(storageAcc, mother);

  const xdr = buildTrx.toXDR();
  const singedXdr = WithSing({ xdr, signWith });
  // console.log(singedXdr, "singedXdr");
  return singedXdr;
}
