import axios, { type AxiosResponse } from "axios";
import type { CheckAnyPlotProps, HorizonAccount } from "../interfaces";
import log from "../logger/logger";
import { CODE_ISSUER_JOINER } from "../constants";
import { joinCodeIssuer } from "../helper/helper_client";

export async function checkAnyPlot({
  pubkey,
  checkData,
  mainPlotCheck,
  listOutput,
}: CheckAnyPlotProps) {
  const getUrl = `https://horizon.stellar.org/accounts/${pubkey}`;
  let resp: AxiosResponse<HorizonAccount>;

  try {
    resp = await axios.get(getUrl);
  } catch (e) {
    log.error(e);
    return listOutput ? [] : false;
  }

  const balances = resp.data.balances;
  const matchAsset: string[] = [];

  let mainAssetFound = !mainPlotCheck;
  for (const checkLimit of checkData.limits) {
    let limitAssetFound = false;
    for (const bal of balances) {
      if (
        !mainAssetFound &&
        bal.asset_code === checkData.main.code &&
        bal.asset_issuer === checkData.main.issuer &&
        +bal.balance >= checkData.main.limit
      ) {
        mainAssetFound = true;
      }
      if (
        (listOutput || !limitAssetFound) &&
        bal.asset_code === checkLimit.code &&
        bal.asset_issuer === checkLimit.issuer &&
        +bal.balance >= checkLimit.limit
      ) {
        matchAsset.push(joinCodeIssuer(checkLimit));
        limitAssetFound = true;
      }
      if (!listOutput && mainAssetFound && limitAssetFound) {
        return true;
      }
    }
  }
  if (listOutput) {
    return matchAsset;
  }
  return false;
}

export function filterUniqueItems(arr: string[]): string[] {
  const uniqueItems = new Set<string>();

  for (let i = arr.length - 1; i >= 0; i--) {
    const uniqueItem = arr[i]!.split(CODE_ISSUER_JOINER)[0]!.slice(0, 10);
    if (uniqueItems.has(uniqueItem)) {
      arr.splice(i, 1);
    } else {
      uniqueItems.add(uniqueItem);
    }
  }

  return arr;
}
