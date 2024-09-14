import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { STORAGE_SECRET } from "../SECRET";
import {
  STROOP,
  STELLAR_URL,
  PLATFORM_ASSET,
  networkPassphrase,
  TrxBaseFee,
} from "../../constant";

export async function covertSiteAsset2XLM(props: {
  siteAssetAmount: number;
  pubkey: string;
  xlm: string;
  secret: string;
}) {
  // take siteAsset and send xlm from storage
  const { pubkey, siteAssetAmount, xlm, secret } = props;

  const assetAmount = (Number(siteAssetAmount) * Number(STROOP))
    .toFixed(7)
    .toString();

  const server = new Horizon.Server(STELLAR_URL);

  const storageAcc = Keypair.fromSecret(STORAGE_SECRET);
  const pubAcc = Keypair.fromSecret(secret);

  const transactionInializer = await server.loadAccount(pubkey);

  const Tx = new TransactionBuilder(transactionInializer, {
    fee: TrxBaseFee,
    networkPassphrase,
  })
    // 0 send xlm to user
    .addOperation(
      Operation.payment({
        destination: pubkey,
        amount: xlm,
        asset: Asset.native(),
        source: storageAcc.publicKey(),
      }),
    )
    //1
    .addOperation(
      Operation.payment({
        asset: PLATFORM_ASSET,
        amount: assetAmount,
        source: pubkey,
        destination: storageAcc.publicKey(),
      }),
    )

    .setTimeout(0)
    .build();

  Tx.sign(storageAcc, pubAcc);

  const transectionXDR = Tx.toXDR();

  return transectionXDR;
}
