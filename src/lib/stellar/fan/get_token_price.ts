import axios from "axios";
import { env } from "~/env";
import { PLATFROM_ASSET } from "./constant";

interface PlatformAssetInfo {
  price: number;
}

export async function getAssetPrice(): Promise<number> {
  try {
    const response = await axios.get<PlatformAssetInfo>(
      `https://api.stellar.expert/explorer/public/asset/${PLATFROM_ASSET.code}-${PLATFROM_ASSET.issuer}`,
    );

    const platformAssetInfo = response.data;
    const price = platformAssetInfo.price;

    return price;
  } catch (error) {
    console.error(`Error fetching ${PLATFROM_ASSET.code}  price:`, error);
    throw error;
  }
}

export async function getPlatfromAssetPrice() {
  if (env.NEXT_PUBLIC_STELLAR_PUBNET) return await getAssetPrice();
  else return 0.5;
}

export async function getplatformAssetNumberForXLM(xlm = 1.5) {
  const price = await getPlatfromAssetPrice();
  return Math.ceil((xlm * 0.12) / price);
}

// later found from albedo
// export async function getSwapValueOfATokenForXLM({
//   amount,
//   assetCode,
//   issuer,
// }: {
//   assetCode: string;
//   issuer: string;
//   amount: number;
// }) {
//   const url = `https://horizon.stellar.org/paths/strict-send?source_asset_type=native&source_amount=${amount}&destination_assets=${assetCode}%3A${issuer}`;
//   try {
//     const response = await axios.get(url);
//     const assetNumber = response.data.destination_amount as number;

//     return assetNumber;
//   } catch (error) {
//     console.error(`Error fetching asset number for ${assetCode}:`, error);
//     throw error;
//   }
// }
