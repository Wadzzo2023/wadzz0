/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  xdr,
  Transaction,
  Networks,
  Server,
  type Horizon,
  type Memo,
  type MemoType,
  type Operation,
} from "stellar-sdk";
import log from "~/lib/logger/logger";
export const recursiveTransactionSubmitter = async (
  transaction: Transaction<Memo<MemoType>, Operation[]>,
): Promise<Horizon.SubmitTransactionResponse> => {
  let result: Horizon.SubmitTransactionResponse;
  try {
    const server = new Server("https://horizon.stellar.org");

    result = await server.submitTransaction(transaction);
    return result;
  } catch (error: any) {
    log.info(error);
    if (error.response) {
      log.info(error.response.data.extras);
      if (error.response.status === 504) {
        return recursiveTransactionSubmitter(transaction);
      } else if (error.response.status === 400) {
        log.info(error);
        throw "bad seq happened";
      }
    }

    throw "other error happens";
  }
};

export function concatAssetWithIssuer(
  asset_code: string,
  asset_issuer: string,
): string {
  return `${asset_code}-${asset_issuer}`;
}

export function getAssetIssuerFromConcat(
  concatenatedStr: string,
): [string, string] {
  const parts = concatenatedStr.split("-");
  if (parts.length === 2) {
    return [parts[0]!, parts[1]!];
  } else {
    throw new Error("Invalid format: The string does not contain a hyphen.");
  }
}
