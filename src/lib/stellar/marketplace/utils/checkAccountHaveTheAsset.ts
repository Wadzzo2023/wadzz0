import axios from "axios";
import log from "~/lib/logger/logger";
import { HorizonAccount } from "./asset";

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
        log.info(assetCode, "==", asset.asset_code);
        if (asset.asset_code == assetCode) {
          return true;
          break;
        }
      }
    }
    return false;
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
}
