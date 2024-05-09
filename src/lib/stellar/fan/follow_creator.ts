import { Asset, Operation, Server, TransactionBuilder } from "stellar-sdk";
import { SignUserType, WithSing } from "../utils";
import { STELLAR_URL, networkPassphrase } from "./constant";
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
  const server = new Server(STELLAR_URL);

  // const creatorStorageAcc = Keypair.fromSecret(creatorStorageSec);
  const asset = new Asset(creatorPageAsset.code, creatorPageAsset.issuer);

  // const motherAccount = Keypair.fromSecret(env.MOTHER_SECRET);

  const transactionInializer = await server.loadAccount(userPubkey);

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  });

  Tx1.addOperation(
    Operation.changeTrust({
      asset,
    }),
  )

    .setTimeout(0);

  const buildTrx = Tx1.build();

  const xdr = buildTrx.toXDR();
  const singedXdr = WithSing({ xdr, signWith });

  return singedXdr;
}
