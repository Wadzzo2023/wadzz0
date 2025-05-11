import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import { networkPassphrase } from "../constant";

export function signXdrTransaction(
  xdrTransaction: string,
  secretKey: string,
): string {
  // Decode XDR to Transaction object
  const transaction = TransactionBuilder.fromXDR(
    xdrTransaction,
    networkPassphrase,
  );

  // Sign the transaction
  const keypair = Keypair.fromSecret(secretKey);
  transaction.sign(keypair);

  // Encode the signed transaction back to XDR
  return transaction.toXDR();
}
