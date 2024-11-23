import {
  Asset,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

import {
  PLATFORM_ASSET,
  TrxBaseFee,
  STELLAR_URL,
  networkPassphrase,
  TrxBaseFeeInPlatformAsset,
  PLATFORM_FEE,
} from "../constant";
import { AccountType } from "./utils";
import { SignUserType, WithSing } from "../utils";
import { env } from "~/env";
import { getplatformAssetNumberForXLM as getPlatformAssetNumberForXLM } from "./get_token_price";
import { use } from "react";

const log = console;

export async function createStorageTrx({
  pubkey,
  signWith,
}: {
  pubkey: string;
  signWith: SignUserType;
}) {
  /*
  |---------------------------------------------------
  | Create storage account and also trust storage token
  |---------------------------------------------------
  */
  const server = new Horizon.Server(STELLAR_URL);

  const storageAcc = Keypair.random();
  const motherAcc = Keypair.fromSecret(env.MOTHER_SECRET);

  const transactionInializer = await server.loadAccount(motherAcc.publicKey());

  // total platform token r

  const requiredAsset2refundXlm = await getPlatformAssetNumberForXLM(5);
  const totalAction =
    requiredAsset2refundXlm +
    Number(TrxBaseFeeInPlatformAsset) +
    Number(PLATFORM_FEE);

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: TrxBaseFee,
    networkPassphrase,
  })
    // send mother required platform fee and extra
    .addOperation(
      Operation.payment({
        destination: motherAcc.publicKey(),
        amount: totalAction.toString(),
        asset: PLATFORM_ASSET,
        source: pubkey,
      }),
    )

    // send required xlm to the user account pubkey
    .addOperation(
      Operation.payment({
        destination: pubkey,
        amount: "5", // 0.5 for pubkey and .5 for storage trust, and 4 for storage bal
        asset: Asset.native(),
        source: motherAcc.publicKey(),
      }),
    )

    // create storage account
    .addOperation(
      Operation.createAccount({
        destination: storageAcc.publicKey(),
        startingBalance: "4.5", // 4 for escrow and 0.5 for trust
        source: pubkey,
      }),
    )
    .addOperation(
      Operation.changeTrust({
        asset: PLATFORM_ASSET,
        source: pubkey,
      }),
    )
    .addOperation(
      Operation.changeTrust({
        asset: PLATFORM_ASSET,
        source: storageAcc.publicKey(),
      }),
    )
    // pay the creator the price amount

    .setTimeout(0)
    .build();

  Tx1.sign(storageAcc, motherAcc);

  const storage: AccountType = {
    publicKey: storageAcc.publicKey(),
    secretKey: storageAcc.secret(),
  };

  const xdr = await WithSing({ xdr: Tx1.toXDR(), signWith });

  return { xdr, storage };
}

export async function createStorageTrxWithXLM({
  pubkey,
  signWith,
}: {
  pubkey: string;
  signWith: SignUserType;
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const storageAcc = Keypair.random();

  const motherAcc = Keypair.fromSecret(env.MOTHER_SECRET);

  const transactionInitializer = await server.loadAccount(pubkey);

  const Tx1 = new TransactionBuilder(transactionInitializer, {
    fee: TrxBaseFee,
    networkPassphrase,
  })
    // send mother required platform fee and extra
    .addOperation(
      Operation.payment({
        destination: motherAcc.publicKey(),
        amount: "2",
        asset: Asset.native(),
        source: pubkey,
      }),
    )
    // create storage account
    .addOperation(
      Operation.createAccount({
        destination: storageAcc.publicKey(),
        startingBalance: "4.5", // 4 for escrow and 0.5 for trust
      }),
    )
    .addOperation(
      Operation.changeTrust({
        asset: PLATFORM_ASSET,
        source: pubkey,
      }),
    )
    .addOperation(
      Operation.changeTrust({
        asset: PLATFORM_ASSET,
        source: storageAcc.publicKey(),
      }),
    )
    .setTimeout(0)
    .build();

  Tx1.sign(storageAcc);

  const storage: AccountType = {
    publicKey: storageAcc.publicKey(),
    secretKey: storageAcc.secret(),
  };

  const xdr = await WithSing({ xdr: Tx1.toXDR(), signWith });

  return { xdr, storage };
}
