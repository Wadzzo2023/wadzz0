import {
  Asset,
  BASE_FEE,
  Keypair,
  Operation,
  Server,
  TransactionBuilder,
} from "stellar-sdk";
import { env } from "~/env";

import { STROOP, networkPassphrase, STELLAR_URL } from "../constant";
import { STORAGE_SECRET } from "../SECRET";
import { SITE_ASSET } from "./constant";
import {
  alreadyHaveTrustOnNft,
  checkNativeBalance,
  checkSiteAssetBalance,
} from "./utils";

export async function buyNftTransection({
  assetCode,
  issuerPub,
  userPub,
  price,
  limit,
  secret,
  sellerPub,
}: {
  userPub: string;
  assetCode: string;
  issuerPub: string;
  price: string; // here price is count of siteAsset
  limit: string;
  secret?: string;
  sellerPub?: string;
}) {
  const assetLimit = (Number(limit) / Number(STROOP)).toFixed(7).toString();
  const asset = new Asset(assetCode, issuerPub);
  const server = new Server(STELLAR_URL);

  const storageAcc = Keypair.fromSecret(STORAGE_SECRET);

  const transactionInializer = await server.loadAccount(userPub);

  const siteAssetBal = checkSiteAssetBalance(transactionInializer);
  const nativeBal = checkNativeBalance(transactionInializer);

  // handle nativeBal
  if (nativeBal) {
    if (Number(nativeBal) < 2) {
      throw new Error(
        "Your account is not activated. Please contact an admin and let them know. Error code: no_native_balance",
      );
    }
  }

  if (siteAssetBal) {
    if (Number(siteAssetBal) < Number(price)) {
      console.log(siteAssetBal, price, "chek");
      throw new Error(`You don't have sufficient ${env.NEXT_PUBLIC_SITE}`);
    }
  } else {
    throw new Error(`You don't have sufficient ${env.NEXT_PUBLIC_SITE}`);
  }

  const destination = sellerPub ?? storageAcc.publicKey(); // for original or without seller it will be siteAssetDestination

  // checking asset has already trust
  const hasTrust = await alreadyHaveTrustOnNft({
    pubkey: userPub,
    asset,
    accRes: transactionInializer,
  });

  let Tx2;

  if (hasTrust) {
    Tx2 = new TransactionBuilder(transactionInializer, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      //0 send siteAsset
      .addOperation(
        Operation.payment({
          destination: destination,
          amount: price,
          asset: SITE_ASSET,
          source: userPub,
        }),
      )
      //1 nfts trust change
      .addOperation(
        Operation.changeTrust({
          asset: asset,
          limit: assetLimit,
          source: userPub,
        }),
      )
      //2
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
    console.log("nft has already trust..");
  } else {
    // that means here have no trust on nft and extra trust cost should go to storagepub
    Tx2 = new TransactionBuilder(transactionInializer, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      //0 send site Asset
      .addOperation(
        Operation.payment({
          destination: destination,
          amount: price,
          asset: SITE_ASSET,
          source: userPub,
        }),
      )
      .addOperation(
        Operation.payment({
          destination: storageAcc.publicKey(),
          amount: "50",
          asset: SITE_ASSET,
          source: userPub,
        }),
      )
      //1 nfts trust change
      .addOperation(
        Operation.changeTrust({
          asset: asset,
          limit: assetLimit,
          source: userPub,
        }),
      )
      //2
      .addOperation(
        Operation.payment({
          asset: asset,
          amount: STROOP,
          source: storageAcc.publicKey(),
          destination: userPub,
        }),
      )
      // 3 send 0.5 xml to user
      .addOperation(
        Operation.payment({
          amount: "0.5",
          asset: Asset.native(),
          destination: userPub,
          source: storageAcc.publicKey(),
        }),
      )
      .setTimeout(0)
      .build();
  }

  if (secret) {
    // fb and google acc
    const userAcc = Keypair.fromSecret(secret);
    Tx2.sign(storageAcc, userAcc);

    const transectionXDR = Tx2.toXDR();
    return transectionXDR;
  }

  // for other wallet client
  Tx2.sign(storageAcc);
  const transectionXDR = Tx2.toXDR();
  return transectionXDR;
}
