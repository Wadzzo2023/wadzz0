import { Keypair, Operation, Server, TransactionBuilder } from "stellar-sdk";

import { STELLAR_URL, networkPassphrase } from "./constant";
import { AccountType } from "./utils";
import { SignUserType, WithSing } from "../utils";

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
  const server = new Server(STELLAR_URL);

  const storageAcc = Keypair.random();

  const transactionInializer = await server.loadAccount(pubkey);

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  })

    // get payment
    .addOperation(
      Operation.createAccount({
        destination: storageAcc.publicKey(),
        startingBalance: "100", // TODO: change to 1.5
      }),
    )
    // pay the creator the price amount

    .setTimeout(0)
    .build();

  const storage: AccountType = {
    publicKey: storageAcc.publicKey(),
    secretKey: storageAcc.secret(),
  };

  const xdr = await WithSing({ xdr: Tx1.toXDR(), signWith });

  return { xdr, storage };
}
