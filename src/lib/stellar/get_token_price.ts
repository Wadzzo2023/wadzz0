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
  else return 1;
}

export async function getAssetNumberForXLM(xlm = 1.5) {
  const price = await getPlatfromAssetPrice();
  console.log("price", price);
  return Math.floor((xlm * 0.12) / price);
}
