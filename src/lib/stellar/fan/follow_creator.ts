import {
  Asset,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { env } from "~/env";
import { STELLAR_URL, TrxBaseFee, networkPassphrase } from "../constant";
import { SignUserType, WithSing } from "../utils";
import { MyAssetType } from "./utils";

/**
 * Following a creator don't need fee from user.
 * All fee will be paid by platform.
 *
 */
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

  const asset = new Asset(creatorPageAsset.code, creatorPageAsset.issuer);

  const motherAccount = Keypair.fromSecret(env.MOTHER_SECRET);

  const transactionInializer = await server.loadAccount(
    motherAccount.publicKey(),
  );

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200", // mother paying fee but no return
    networkPassphrase,
  });

  Tx1.addOperation(
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
