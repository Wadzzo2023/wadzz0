import {
  Asset,
  Keypair,
  Operation,
  TransactionBuilder,
  Horizon,
} from "@stellar/stellar-sdk";
import { SignUserType, WithSing } from "../utils";
import { STELLAR_URL, networkPassphrase } from "../constant";
import { MyAssetType } from "../fan/utils";

export async function follow_brand({
  creatorPageAsset,
  userSecret,
}: {
  creatorPageAsset: MyAssetType;
  userSecret: string;
}) {
  const server = new Horizon.Server(STELLAR_URL);

  const userAcc = Keypair.fromSecret(userSecret);
  const asset = new Asset(creatorPageAsset.code, creatorPageAsset.issuer);

  // const motherAccount = Keypair.fromSecret(env.MOTHER_SECRET);

  const transactionInializer = await server.loadAccount(userAcc.publicKey());

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  })

    .addOperation(
      Operation.changeTrust({
        asset,
      }),
    )

    .setTimeout(0)
    .build();

  Tx1.sign(userAcc);

  //   const xdr = Tx1.toXDR();

  return Tx1.toXDR();
}