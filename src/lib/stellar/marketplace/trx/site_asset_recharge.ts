import {
  BASE_FEE,
  Keypair,
  Operation,
  Horizon,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { STROOP, STELLAR_URL } from "../constant";
import { STORAGE_SECRET } from "../SECRET";
import { SITE_ASSET, SITE_ASSET_OBJ } from "./constant";
import { networkPassphrase } from "../constant";
import { PLATFROM_ASSET } from "../../constant";

async function checkSiteAssetTrustLine(accPub: string) {
  const server = new Horizon.Server(STELLAR_URL);
  const accRes = await server.loadAccount(accPub);
  for (const bal of accRes.balances) {
    if (
      bal.asset_type == "credit_alphanum12" ||
      bal.asset_type == "credit_alphanum4"
    ) {
      if (
        bal.asset_code == SITE_ASSET_OBJ.asset_code &&
        bal.asset_issuer == SITE_ASSET_OBJ.asset_issuer
      ) {
        if (bal.is_authorized) {
          return true;
        }
      }
    }
  }
  return false;
}

export async function sendSiteAsset2pub(
  pubkey: string,
  siteAssetAmount: number,
  // secret: string, // have secret means that the user don't have trust
) {
  // 1. Create trustline - wadzzo
  // 2. Send X amount - wadzzo

  const server = new Horizon.Server(STELLAR_URL);

  const storageAcc = Keypair.fromSecret(STORAGE_SECRET);
  // const userAcc = Keypair.fromSecret(secret);

  const transactionInializer = await server.loadAccount(storageAcc.publicKey());

  const balances = transactionInializer.balances;
  const trust = balances.find((balance) => {
    if (
      balance.asset_type === "credit_alphanum12" ||
      balance.asset_type === "credit_alphanum4"
    ) {
      if (
        balance.asset_code === PLATFROM_ASSET.code &&
        balance.asset_issuer === PLATFROM_ASSET.issuer
      ) {
        return true;
      }
    }
  });

  if (!trust) throw new Error("No trustline for platform asset");

  // if (!hasWadzzoTrust) {
  const Tx = new TransactionBuilder(transactionInializer, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.changeTrust({
        asset: SITE_ASSET,
        source: pubkey,
      }),
    )
    .addOperation(
      Operation.payment({
        destination: pubkey,
        amount: siteAssetAmount.toString(), //copy,
        asset: SITE_ASSET,
        source: storageAcc.publicKey(),
      }),
    )
    .setTimeout(0)
    .build();

  Tx.sign(storageAcc);

  return Tx.toXDR();
}

export async function sendXLM_SiteAsset(props: {
  siteAssetAmount: number;
  pubkey: string;
  xlm: number;
  secret: string;
}) {
  const { pubkey, siteAssetAmount, xlm, secret } = props;
  // change wadzooNum to 1 fo testing

  const server = new Horizon.Server(STELLAR_URL);

  const storageAcc = Keypair.fromSecret(STORAGE_SECRET);
  const pubAcc = Keypair.fromSecret(secret);

  const transactionInializer = await server.loadAccount(storageAcc.publicKey());

  const Tx = new TransactionBuilder(transactionInializer, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.createAccount({
        destination: pubkey,
        startingBalance: xlm.toString(),
      }),
    )
    //1
    .addOperation(
      Operation.changeTrust({
        asset: SITE_ASSET,
        source: pubkey,
      }),
    )

    .addOperation(
      Operation.payment({
        destination: pubkey,
        amount: siteAssetAmount.toString(), //copy,
        asset: SITE_ASSET,
        source: storageAcc.publicKey(),
      }),
    )

    .setTimeout(0)
    .build();

  Tx.sign(storageAcc, pubAcc);

  const transectionXDR = Tx.toXDR();

  return transectionXDR;
}
