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
import { STELLAR_URL, networkPassphrase } from "./constant";
import { AccountType } from "./utils";

// transection variables

export async function clawBackAccCreate({
  pubkey,
  assetCode,
}: {
  pubkey: string;
  assetCode: string;
}) {
  const server = new Server(STELLAR_URL);

  const distributorAcc = Keypair.fromSecret(env.DISTRIBUTOR_SECRET);

  const escrowAcc = Keypair.random();
  const asset = new Asset(assetCode, escrowAcc.publicKey());

  const transactionInializer = await server.loadAccount(pubkey);
  const limit = "50000";

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  })

    // 0
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
        limit,
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
    .setTimeout(0)
    .build();

  await Tx1.sign(escrowAcc, distributorAcc);

  const escrow: AccountType = {
    publicKey: escrowAcc.publicKey(),
    secretKey: escrowAcc.secret(),
  };

  return { trx: Tx1.toXDR(), escrow };
}
