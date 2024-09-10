import { Horizon } from "@stellar/stellar-sdk";
import { PLATFORM_ASSET, STELLAR_URL, STROOP } from "../../constant";

export function checkSiteAssetBalance(accRes: Horizon.AccountResponse) {
  for (const balance of accRes.balances) {
    if (
      balance.asset_type === "credit_alphanum12" ||
      balance.asset_type === "credit_alphanum4"
    ) {
      if (
        balance.asset_code == PLATFORM_ASSET.code &&
        balance.asset_issuer == PLATFORM_ASSET.issuer
      ) {
        return balance.balance;
      }
    }
  }
}

export function checkNativeBalance(accRes: Horizon.AccountResponse) {
  for (const balance of accRes.balances) {
    if (balance.asset_type == "native") {
      return balance.balance;
    }
  }
}

export function getAssetCount(balance: string) {
  return Number(balance) / Number(STROOP);
}

export function getPrice(balance: string) {
  return (Number(balance) * Number(STROOP)).toFixed(7).toString();
}

export async function alreadyHaveTrustOnNft({
  pubkey,
  asset,
  accRes,
}: {
  pubkey: string;
  asset: { code: string; issuer: string };
  accRes?: Horizon.AccountResponse;
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const transactionInializer = accRes ?? (await server.loadAccount(pubkey));

  for (const item of transactionInializer.balances) {
    if (
      item.asset_type == "credit_alphanum12" ||
      item.asset_type == "credit_alphanum4"
    ) {
      if (
        item.asset_code == asset.code &&
        item.asset_issuer == asset.issuer &&
        item.is_authorized
      )
        return true;
    }
  }
  return false;
}
