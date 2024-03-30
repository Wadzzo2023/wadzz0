import {
  BASE_FEE,
  Keypair,
  Operation,
  Server,
  Networks,
  TransactionBuilder,
  Asset,
  AuthClawbackEnabledFlag,
  AuthRevocableFlag,
  AuthFlag,
} from "stellar-sdk";
import { env } from "~/env";
import {
  PLATFROM_ASSET,
  PLATFROM_FEE,
  STELLAR_URL,
  networkPassphrase,
} from "./constant";
import { AccountType } from "./utils";
import { SignUserType, WithSing } from "../utils";
import { getAssetNumberForXLM } from "./get_token_price";

// transection variables

export async function clawBackAccCreate({
  pubkey,
  assetCode,
  signWith,
  storageSecret,
}: {
  pubkey: string;
  assetCode: string;
  signWith: SignUserType;
  storageSecret: string;
}) {
  const server = new Server(STELLAR_URL);
  const limit = "50000";

  const requiredAsset2refundXlm = await getAssetNumberForXLM(2);
  const totalAction = requiredAsset2refundXlm + Number(PLATFROM_FEE);

  const storageAcc = Keypair.fromSecret(storageSecret);
  const PLATFORM_MOTHER_ACC = Keypair.fromSecret(env.MOTHER_SECRET);

  const escrowAcc = Keypair.random();
  const asset = new Asset(assetCode, escrowAcc.publicKey());

  const transactionInializer = await server.loadAccount(pubkey);

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  })
    // first get action for required xlm. and platformFee
    .addOperation(
      Operation.payment({
        destination: PLATFORM_MOTHER_ACC.publicKey(),
        asset: PLATFROM_ASSET,
        amount: totalAction.toString(),
      }),
    )

    // send this required xlm to storage so that it can lock new  trusting asset (0.5xlm)
    .addOperation(
      Operation.payment({
        destination: storageAcc.publicKey(),
        asset: Asset.native(),
        amount: "0.5",
        source: PLATFORM_MOTHER_ACC.publicKey(),
      }),
    )

    // create escrow acc
    .addOperation(
      Operation.createAccount({
        destination: escrowAcc.publicKey(),
        startingBalance: "1.5",
        source: PLATFORM_MOTHER_ACC.publicKey(),
      }),
    )
    // 1 escrow acc setting his auth clawbackflag.
    .addOperation(
      Operation.setOptions({
        homeDomain: "tier.bandcoin.io",
        setFlags: (AuthClawbackEnabledFlag | AuthRevocableFlag) as AuthFlag,
        source: escrowAcc.publicKey(),
      }),
    )
    // 2 storage changing trust.
    .addOperation(
      Operation.changeTrust({
        asset,
        source: storageAcc.publicKey(),
      }),
    )
    // 3
    .addOperation(
      Operation.payment({
        asset: asset,
        amount: limit,
        source: escrowAcc.publicKey(),
        destination: storageAcc.publicKey(),
      }),
    )

    .setTimeout(0)
    .build();

  // sign
  Tx1.sign(escrowAcc, storageAcc, PLATFORM_MOTHER_ACC);

  // fab and oogle user sing
  const trx = Tx1.toXDR();
  const signedXDr = await WithSing({ xdr: trx, signWith });

  const escrow: AccountType = {
    publicKey: escrowAcc.publicKey(),
    secretKey: escrowAcc.secret(),
  };

  return { trx: signedXDr, escrow };
}
