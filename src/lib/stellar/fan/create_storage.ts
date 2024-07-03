import {
  Asset,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

import {
  PLATFROM_ASSET,
  PLATFROM_FEE,
  STELLAR_URL,
  networkPassphrase,
} from "../constant";
import { AccountType } from "./utils";
import { SignUserType, WithSing } from "../utils";
import { env } from "~/env";
import { getplatformAssetNumberForXLM } from "./get_token_price";

const log = console;

export async function createStorageTrx({
  pubkey,
  signWith,
}: {
  pubkey: string;
  signWith: SignUserType;
}) {
  /*
  |---------------------------------------------------
  | Create storage account and also trust storage token
  |---------------------------------------------------
  */
  const server = new Horizon.Server(STELLAR_URL);

  const storageAcc = Keypair.random();
  const motherAcc = Keypair.fromSecret(env.MOTHER_SECRET);

  const transactionInializer = await server.loadAccount(pubkey);

  // total platform token r

  const requiredAsset2refundXlm = await getplatformAssetNumberForXLM(5);
  const totalAction = (requiredAsset2refundXlm + Number(PLATFROM_FEE)).toFixed(
    7,
  );

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  })
    // send mother required platform fee and extra
    .addOperation(
      Operation.payment({
        destination: motherAcc.publicKey(),
        amount: totalAction.toString(),
        asset: PLATFROM_ASSET,
        source: pubkey,
      }),
    )

    // send required xlm to the user account pubkey
    .addOperation(
      Operation.payment({
        destination: pubkey,
        amount: "5", // 0.5 for pubkey and .5 for storage trust, and 4 for storage bal
        asset: Asset.native(),
        source: motherAcc.publicKey(),
      }),
    )

    // create storage account
    .addOperation(
      Operation.createAccount({
        destination: storageAcc.publicKey(),
        startingBalance: "4.5", // 4 for escrow and 0.5 for trust
      }),
    )
    .addOperation(Operation.changeTrust({ asset: PLATFROM_ASSET }))
    .addOperation(
      Operation.changeTrust({
        asset: PLATFROM_ASSET,
        source: storageAcc.publicKey(),
      }),
    )
    // pay the creator the price amount

    .setTimeout(0)
    .build();

  Tx1.sign(storageAcc, motherAcc);

  const storage: AccountType = {
    publicKey: storageAcc.publicKey(),
    secretKey: storageAcc.secret(),
  };

  const xdr = await WithSing({ xdr: Tx1.toXDR(), signWith });

  return { xdr, storage };
}
