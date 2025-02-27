import {
  Asset,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { MyAssetType } from "../fan/utils";
import { SignUserType, WithSing } from "../utils";
import { networkPassphrase, PLATFORM_ASSET, STELLAR_URL, TrxBaseFee } from "../constant";
import { env } from "~/env";

export async function ClaimXDR({
  asset,
  amount,
  storageSecret,
  receiver,
  signWith,

}: {
  asset: MyAssetType;
  amount: string;
  storageSecret: string;
  receiver: string;
  signWith: SignUserType;

}) {
  const server = new Horizon.Server(STELLAR_URL);

  const storageAcc = Keypair.fromSecret(storageSecret);
  const claimAsset = new Asset(asset.code, asset.issuer);
  const motherAccount = Keypair.fromSecret(env.MOTHER_SECRET);
  const userAcc = await server.loadAccount(receiver);
  const balance = userAcc.balances.find(
    (balance) => {
      if (balance?.asset_type === "credit_alphanum4" || balance?.asset_type === "credit_alphanum12") {
        if (balance.asset_code === PLATFORM_ASSET.code && balance.asset_issuer === PLATFORM_ASSET.issuer) {
          return balance.balance;
        }
      }
    }
  );
  if (!balance) {
    throw new Error(`You need at least 30 ${PLATFORM_ASSET.code} to claim a pin`);
  }
  if (balance && Number(balance.balance) < 30) {
    throw new Error(`You need at least 30 ${PLATFORM_ASSET.code} to claim a pin`);
  }




  const Tx1 = new TransactionBuilder(userAcc, {
    fee: TrxBaseFee,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        amount: "36",
        asset: PLATFORM_ASSET,
        source: receiver,
        destination: motherAccount.publicKey(),
      }),
    )
    .addOperation(
      Operation.payment({
        amount: "0.6",
        asset: Asset.native(),
        source: motherAccount.publicKey(),
        destination: receiver
      }),
    )
    .addOperation(
      Operation.changeTrust({
        asset: claimAsset,
      }),
    )
    .addOperation(
      Operation.payment({
        amount: amount,
        asset: claimAsset,
        source: storageAcc.publicKey(),
        destination: receiver,
      }),
    )

    .setTimeout(0)
    .build();

  Tx1.sign(storageAcc, motherAccount);

  const xdr = Tx1.toXDR();
  const signedXDr = await WithSing({
    xdr: xdr,
    signWith,
  });

  return signedXDr;
}
