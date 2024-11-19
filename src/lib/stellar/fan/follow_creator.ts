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
} from "../constant";
import { SignUserType, WithSing } from "../utils";
import { getplatformAssetNumberForXLM } from "./get_token_price";
import { MyAssetType } from "./utils";

export async function follow_creator({
  userPubkey,
  creatorPageAsset,
  signWith,
}: {
  userPubkey: string;
  creatorPageAsset: MyAssetType;
  signWith: SignUserType;
}) {
  const server = new Horizon.Server(STELLAR_URL);

  // const creatorStorageAcc = Keypair.fromSecret(creatorStorageSec);
  const asset = new Asset(creatorPageAsset.code, creatorPageAsset.issuer);

  const motherAccount = Keypair.fromSecret(env.MOTHER_SECRET);

  const requiredAsset2refundXlm = await getplatformAssetNumberForXLM(0.5);
  const totalPlatformFee =
    requiredAsset2refundXlm +
    Number(PLATFORM_FEE) +
    Number(TrxBaseFeeInPlatformAsset);

  const transactionInializer = await server.loadAccount(
    motherAccount.publicKey(),
  );

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: TrxBaseFee,
    networkPassphrase,
  });

  Tx1.addOperation(
    Operation.payment({
      destination: motherAccount.publicKey(),
      asset: PLATFORM_ASSET,
      source: userPubkey,
      amount: totalPlatformFee.toFixed(7),
    }),
  )
    .addOperation(
      Operation.payment({
        destination: userPubkey,
        asset: Asset.native(),
        amount: "0.5",
      }),
    )
    .addOperation(
      Operation.changeTrust({
        asset,
        source: userPubkey,
      }),
    )
    .setTimeout(0);

  const buildTrx = Tx1.build();

  buildTrx.sign(motherAccount);

  const xdr = buildTrx.toXDR();
  const singedXdr = WithSing({ xdr, signWith: signWith });

  return singedXdr;
}
