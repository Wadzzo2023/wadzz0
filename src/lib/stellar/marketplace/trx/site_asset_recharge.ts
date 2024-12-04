import {
  BASE_FEE,
  Keypair,
  Operation,
  Horizon,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { MOTHER_SECRET, STORAGE_SECRET } from "../SECRET";
import { STELLAR_URL, PLATFORM_ASSET, networkPassphrase } from "../../constant";

async function checkSiteAssetTrustLine(accPub: string) {
  const server = new Horizon.Server(STELLAR_URL);
  const accRes = await server.loadAccount(accPub);
  for (const bal of accRes.balances) {
    if (
      bal.asset_type == "credit_alphanum12" ||
      bal.asset_type == "credit_alphanum4"
    ) {
      if (
        bal.asset_code == PLATFORM_ASSET.code &&
        bal.asset_issuer == PLATFORM_ASSET.issuer
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
) {
  const server = new Horizon.Server(STELLAR_URL);

  const motherAcc = Keypair.fromSecret(MOTHER_SECRET);

  const transactionInitializer = await server.loadAccount(
    motherAcc.publicKey(),
  );

  const balances = transactionInitializer.balances;
  const trust = balances.find((balance) => {
    if (
      balance.asset_type === "credit_alphanum12" ||
      balance.asset_type === "credit_alphanum4"
    ) {
      if (
        balance.asset_code === PLATFORM_ASSET.code &&
        balance.asset_issuer === PLATFORM_ASSET.issuer
      ) {
        return true;
      }
    }
  });

  if (!trust) throw new Error("No trust line for platform asset");

  const Tx = new TransactionBuilder(transactionInitializer, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: pubkey,
        amount: siteAssetAmount.toString(), //copy,
        asset: PLATFORM_ASSET,
      }),
    )
    .setTimeout(0)
    .build();

  Tx.sign(motherAcc);

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
        asset: PLATFORM_ASSET,
        source: pubkey,
      }),
    )

    .addOperation(
      Operation.payment({
        destination: pubkey,
        amount: siteAssetAmount.toString(), //copy,
        asset: PLATFORM_ASSET,
        source: storageAcc.publicKey(),
      }),
    )

    .setTimeout(0)
    .build();

  Tx.sign(storageAcc, pubAcc);

  const transectionXDR = Tx.toXDR();

  return transectionXDR;
}
