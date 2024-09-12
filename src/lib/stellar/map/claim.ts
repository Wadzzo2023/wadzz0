import {
  Asset,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { MyAssetType } from "../fan/utils";
import { SignUserType, WithSing } from "../utils";
import { networkPassphrase, STELLAR_URL, TrxBaseFee } from "../constant";

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

  // const motherAccount = Keypair.fromSecret(env.MOTHER_SECRET);

  const transactionInializer = await server.loadAccount(receiver);

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: TrxBaseFee,
    networkPassphrase,
  })

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

  Tx1.sign(storageAcc);

  const xdr = Tx1.toXDR();
  const signedXDr = await WithSing({
    xdr: xdr,
    signWith,
  });

  return signedXDr;
}
