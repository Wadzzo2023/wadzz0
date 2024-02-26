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

// transection variables

export async function clawBackAccCreate({
  pubkey,
  assetCode,
  actionAmount,
}: {
  pubkey: string;
  assetCode: string;
  actionAmount: string; // this is amount that will be used to refund xlm
}) {
  const server = new Server(STELLAR_URL);
  const limit = "50000";

  const distributorAcc = Keypair.fromSecret(env.DISTRIBUTOR_SECRET);

  const escrowAcc = Keypair.random();
  const asset = new Asset(assetCode, escrowAcc.publicKey());

  const transactionInializer = await server.loadAccount(pubkey);

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  })
    // first get action for required xlm.
    .addOperation(
      Operation.payment({
        destination: distributorAcc.publicKey(),
        asset: PLATFROM_ASSET,
        amount: actionAmount,
      }),
    )

    // send this required xlm
    .addOperation(
      Operation.payment({
        destination: pubkey,
        asset: Asset.native(),
        amount: "1.5",
        source: distributorAcc.publicKey(),
      }),
    )

    // create escrow acc
    .addOperation(
      Operation.createAccount({
        destination: escrowAcc.publicKey(),
        startingBalance: "1.5",
        source: pubkey,
      }),
    )
    // 1 escrow acc setting his auth clawbackflag.
    .addOperation(
      Operation.setOptions({
        homeDomain: "test.com",
        setFlags: (AuthClawbackEnabledFlag | AuthRevocableFlag) as AuthFlag,
        source: escrowAcc.publicKey(),
      }),
    )
    // 2 storage changing trust.
    .addOperation(
      Operation.changeTrust({
        asset,
        source: distributorAcc.publicKey(),
      }),
    )
    // 3
    .addOperation(
      Operation.payment({
        asset: asset,
        amount: limit,
        source: escrowAcc.publicKey(),
        destination: distributorAcc.publicKey(),
      }),
    )
    // sending platform fee.
    .addOperation(
      Operation.payment({
        amount: PLATFROM_FEE,
        asset: PLATFROM_ASSET,
        destination: distributorAcc.publicKey(),
      }),
    )
    .setTimeout(0)
    .build();

  Tx1.sign(escrowAcc, distributorAcc);

  const escrow: AccountType = {
    publicKey: escrowAcc.publicKey(),
    secretKey: escrowAcc.secret(),
  };

  return { trx: Tx1.toXDR(), escrow };
}
