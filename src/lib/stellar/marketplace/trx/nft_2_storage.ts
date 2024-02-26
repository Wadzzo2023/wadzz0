import {
  Asset,
  BASE_FEE,
  Keypair,
  Operation,
  Server,
  TransactionBuilder,
} from "stellar-sdk";
import log from "~/lib/logger/logger";
import { DEFAULT_ASSET_LIMIT, STELLAR_URL } from "../constant";
import { STORAGE_SECRET } from "../SECRET";
import { networkPassphrase } from "../constant";
import { getPrice } from "./utils";

export async function sendNft2StorageTransection({
  assetCode,
  issuerPub,
  userPub,
  secret,
  assetCount,
}: {
  userPub: string;
  assetCode: string;
  issuerPub: string;
  assetCount: string;
  secret?: string;
}) {
  const assetAmount = getPrice(assetCount);
  // const assetAmount = DEFAULT_ASSET_LIMIT
  const asset = new Asset(assetCode, issuerPub);
  const server = new Server(STELLAR_URL);

  const storageAcc = Keypair.fromSecret(STORAGE_SECRET);

  const transactionInializer = await server.loadAccount(userPub);

  const Tx2 = new TransactionBuilder(transactionInializer, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    //
    .addOperation(
      Operation.payment({
        destination: storageAcc.publicKey(),
        amount: assetAmount, //copy,
        asset: asset,
        source: userPub,
      }),
    )
    .setTimeout(0)
    .build();

  if (secret) {
    // fb and google acc
    const userAcc = Keypair.fromSecret(secret);
    Tx2.sign(userAcc);

    const transectionXDR = Tx2.toXDR();
    return transectionXDR;
  }

  const transectionXDR = Tx2.toXDR();
  return transectionXDR;
}

export async function revertPlacedNftXDr({
  assetCode,
  issuerPub,
  userPub,
  assetCount,
}: {
  userPub: string;
  assetCode: string;
  issuerPub: string;
  assetCount: string;
}) {
  const assetAmount = getPrice(assetCount);
  // const assetAmount = DEFAULT_ASSET_LIMIT
  const asset = new Asset(assetCode, issuerPub);
  const server = new Server(STELLAR_URL);

  const storageAcc = Keypair.fromSecret(STORAGE_SECRET);

  const transactionInializer = await server.loadAccount(storageAcc.publicKey());

  const Tx2 = new TransactionBuilder(transactionInializer, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    //
    .addOperation(
      Operation.payment({
        source: storageAcc.publicKey(),
        amount: assetAmount, //copy,
        asset: asset,
        destination: userPub,
      }),
    )
    .setTimeout(0)
    .build();

  Tx2.sign(storageAcc);

  const transectionXDR = Tx2.toXDR();
  return transectionXDR;
}

export async function secondTransectionForFbAndGoogleUser({
  assetCode,
  issuerPub,
  userPub,
  price,
  limit,
  secret,
}: {
  userPub: string;
  assetCode: string;
  issuerPub: string;
  price: string;
  limit: string;
  secret: string;
}) {
  // get data from firebase
  // const docRef = doc(db, FCname.auth, uid);
  // const userSnapshot = await getDoc(docRef);

  const assetLimit = (Number(limit) / Number(DEFAULT_ASSET_LIMIT))
    .toFixed(7)
    .toString();
  const asset = new Asset(assetCode, issuerPub);
  const server = new Server(STELLAR_URL);

  const storageAcc = Keypair.fromSecret(STORAGE_SECRET);
  const userAcc = Keypair.fromSecret(secret);

  const transactionInializer = await server.loadAccount(userPub);

  for (const balance of transactionInializer.balances) {
    if (balance.asset_type === "native") {
      if (Number(balance.balance) < Number(price)) {
        throw new Error("You don't have sufficient balance");
      }
      log.info(`XLM Balance for ${userPub}: ${balance.balance}`);
      break;
    }
  }
  const Tx2 = new TransactionBuilder(transactionInializer, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    //1
    .addOperation(
      Operation.payment({
        destination: storageAcc.publicKey(),
        amount: price,
        asset: Asset.native(),
        source: userPub,
      }),
    )
    //2
    .addOperation(
      Operation.changeTrust({
        asset: asset,
        limit: assetLimit,
        source: userPub,
      }),
    )
    // 3
    .addOperation(
      Operation.payment({
        asset: asset,
        amount: DEFAULT_ASSET_LIMIT,
        source: storageAcc.publicKey(),
        destination: userPub,
      }),
    )
    .setTimeout(0)
    .build();

  Tx2.sign(userAcc, storageAcc);

  const transectionXDR = Tx2.toXDR();
  // log.info("transectionXDR: ", transectionXDR);
  return transectionXDR;

  // Tx1.sign(storageAcc);
  // const txResponse = await server.submitTransaction(Tx1);
  // log.info(txResponse);
}
