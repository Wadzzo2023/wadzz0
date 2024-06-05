import axios from "axios";
import log from "~/lib/logger/logger";
import { concatAssetWithIssuer } from "../../music/utils";

export interface HorizonAccount {
  balances: { asset_code: string; asset_issuer: string; balance: string }[];
}
export async function checkAssetInAccount(
  accountId: string,
  assetType: string,
  assetCode: string,
): Promise<boolean> {
  const getUrl = `https://horizon.stellar.org/accounts/${accountId}`;

  try {
    const { data: acc, status } = await axios.get<HorizonAccount>(getUrl);
    if (acc.balances) {
      log.info(acc.balances);
      for (const asset of acc.balances) {
        // log.info(assetCode, "==", asset.asset_code);
        if (asset.asset_code == assetCode) {
          return true;
          break;
        }
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}
export async function getUserAllAssetsInSongAssets(
  accountId: string,
  song_assets: string[],
) {
  const getUrl = `https://horizon.stellar.org/accounts/${accountId}`;

  try {
    const { data: acc, status } = await axios.get<HorizonAccount>(getUrl);
    const userAssets: string[] = [];
    if (acc.balances) {
      for (const asset of acc.balances) {
        const assetWithIssuer = concatAssetWithIssuer(
          asset.asset_code,
          asset.asset_issuer,
        );
        userAssets.push(assetWithIssuer);
      }
    }
    // get intersect element of two array
    const intersected_assets = getIntersection(userAssets, song_assets);
    return intersected_assets;
  } catch (error) {}
}

function getIntersection<T>(array1: T[], array2: T[]): T[] {
  return array1.filter((value) => array2.includes(value));
}
