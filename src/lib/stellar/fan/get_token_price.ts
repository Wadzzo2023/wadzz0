import axios from "axios";
import { env } from "~/env";
import { PLATFORM_ASSET } from "../constant";

interface PlatformAssetInfo {
  price: number;
}

export async function getXlmUsdPrice(): Promise<number> {
  try {
    const response = await axios.get<{ price: string }>(
      "https://api.binance.com/api/v3/avgPrice?symbol=XLMUSDT",
    );

    const xlmUsdPrice = parseFloat(response.data.price);

    return xlmUsdPrice;
  } catch (error) {
    console.error("Error fetching XLM USD price:", error);
    throw error;
  }
}

export async function getXlmNumberForUSD(usd: number): Promise<number> {
  const xlmUsdPrice = await getXlmUsdPrice();
  const xlmNumber = usd / xlmUsdPrice;
  return xlmNumber;
}

export async function getPlatformAssetNumberForUSD(
  usd: number,
): Promise<number> {
  const xlmNumber = await getXlmNumberForUSD(usd);
  const tokenNumber = await getplatformAssetNumberForXLM(xlmNumber);
  return tokenNumber;
}

export async function getAssetPrice(): Promise<number> {
  try {
    const response = await axios.get<PlatformAssetInfo>(
      `https://api.stellar.expert/explorer/${env.NEXT_PUBLIC_STELLAR_PUBNET ? "public" : "testnet"}/asset/${PLATFORM_ASSET.code}-${PLATFORM_ASSET.issuer}`,
    );
    // console.log(response.data);

    const platformAssetInfo = response.data;
    const price = platformAssetInfo.price;

    return price ?? 0.00231;
  } catch (error) {
    console.error(`Error fetching ${PLATFORM_ASSET.code}  price:`, error);
    throw error;
  }
}

export async function getPlatfromAssetPrice() {
  if (env.NEXT_PUBLIC_STELLAR_PUBNET) return await getAssetPrice();
  else return 0.5;
}

export async function getplatformAssetNumberForXLM(xlm = 1.5) {
  if (PLATFORM_ASSET.code === "Wadzzo") return Math.ceil(xlm * 15);
  const price = await getPlatfromAssetPrice();
  return Math.ceil((xlm * 0.12) / price);
}

export async function getPlatformTokenNumberForUSD(
  usd: number,
): Promise<number> {
  const platformAssetPrice = await getAssetPrice();
  const platformTokenNumber = usd / platformAssetPrice;
  return platformTokenNumber;
}
