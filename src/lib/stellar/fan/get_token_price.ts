import axios from "axios";
import { env } from "~/env";

interface BandcoinInfo {
  price: number;
}

export async function getBandcoinPrice(): Promise<number> {
  try {
    const response = await axios.get<BandcoinInfo>(
      "https://api.stellar.expert/explorer/public/asset/BANDCOIN-GCMEPWXKQ4JCBE4NRRFTPAOP22N3NXUHTHJQSWRSKRD7APA6C7T4ESLG",
    );

    const bandcoinInfo = response.data;
    const price = bandcoinInfo.price;

    return price;
  } catch (error) {
    console.error("Error fetching Bandcoin price:", error);
    throw error;
  }
}

export async function getPlatfromAssetPrice() {
  if (env.NEXT_PUBLIC_STELLAR_PUBNET) return await getBandcoinPrice();
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
