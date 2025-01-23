import axios from "axios";
import { env } from "~/env";
import { networkPassphrase, PLATFORM_ASSET } from "../constant";

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

export async function getXLMPrice(): Promise<number> {
  try {
    const response = await axios.get<{ price: string }>(
      "https://api.stellar.expert/explorer/public/asset/XLM",
    );
    // console.log(response.data);

    const xlmUsdPrice = parseFloat(response.data.price);

    return xlmUsdPrice;
  } catch (error) {
    console.error("Error fetching XLM USD price:", error);
    throw error;
  }
}

export async function getAssetPrice(): Promise<number> {
  try {
    const response = await axios.get<PlatformAssetInfo>(
      `https://api.stellar.expert/explorer/public/asset/${PLATFORM_ASSET.code}-${PLATFORM_ASSET.issuer}`,
    );

    const platformAssetInfo = response.data;
    const price = platformAssetInfo.price;
    return price ?? 0.00231;
  } catch (error) {
    console.error(`Error fetching ${PLATFORM_ASSET.code}  price:`, error);
    throw error;
  }
}

export async function getPlatformAssetPrice() {
  if (env.NEXT_PUBLIC_STELLAR_PUBNET) return await getAssetPrice();
  else return 0.5;
}

export async function getplatformAssetNumberForXLM(xlm = 1.5) {
  const xlmPrice = await getXLMPrice();
  if (PLATFORM_ASSET.code.toLocaleLowerCase() === "Wadzzo".toLocaleLowerCase())
    return Math.ceil(xlm * xlmPrice * 100);
  const price = await getPlatformAssetPrice();
  return Math.ceil((xlm * xlmPrice) / price);
}


// 5000 bandcoin 
// 1 bandcoin = 0.0001 usd
// 1 xlm = 0.4 usd
// 1 bandcoin = 0.0001 / 0.4 = 0.00025 xlm
// 5000 bandcoin = 5000 * 0.00025 = 1.25 xlm


// -----Note-----
// amountOfPlatformAsset * priceOfPlatformAssetInUSD / priceOfXLMInUSD = amountOfXLM 

export async function getXLMPriceByPlatformAsset(platformTokenToConvert: number) {
  const platformAssetPriceInUSD = PLATFORM_ASSET.code === "Wadzzo" ? 0.01 : await getAssetPrice();
  const xlmPriceInUSD = await getXLMPrice();
  // if (PLATFORM_ASSET.code.toLocaleLowerCase() === "Wadzzo".toLocaleLowerCase())
  //   return Math.ceil(xlm * xlmPrice * 100);

  return Math.ceil((platformAssetPriceInUSD / xlmPriceInUSD) * platformTokenToConvert);
}

export async function getPlatformTokenNumberForUSD(
  usd: number,
): Promise<number> {
  const platformAssetPrice = await getAssetPrice();
  const platformTokenNumber = usd / platformAssetPrice;
  return platformTokenNumber;
}

export async function getAssetToUSDCRate(): Promise<number> {
  try {
    // https://api.stellar.expert/explorer/public/asset/USDC-GCTDHOF4JMAULZKOX5DKAYHF3JDEQMED73JFMNCJZTO2DMDEJW6VSWIS
    const response = await axios.get<PlatformAssetInfo>(
      "https://api.stellar.expert/explorer/public/asset/USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    );

    const platformAssetInfo = response.data;
    const price = platformAssetInfo.price;

    return price ?? 0.000531;
  } catch (error) {
    console.error(
      `Error fetching USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN price:`,
      error,
    );
    throw error;
  }
}



export async function getAssetPriceByCoddenIssuer({ code, issuer }: {
  code: string,
  issuer: string
}): Promise<number> {
  try {
    const response = await axios.get<PlatformAssetInfo>(
      `https://api.stellar.expert/explorer/public/asset/${code}-${issuer}`,
    );

    const platformAssetInfo = response.data;
    const price = platformAssetInfo.price;
    return price ?? 0.01;
  } catch (error) {
    return 0.01;
  }
}
