import "server-only";

import axios from "axios";

import { env } from "~/env";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";

/**
 * Exchange rates for quotes. Cached for a minute so a quote and the
 * transaction built right after it use the same numbers.
 */
const TTL_MS = 60_000;
const cache = new Map<string, { value: number; at: number }>();

async function cached(key: string, load: () => Promise<number>) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const value = await load();
  cache.set(key, { value, at: Date.now() });
  return value;
}

/** USD per XLM. */
export function xlmUsd() {
  return cached("xlm", async () => {
    try {
      const { data } = await axios.get<{ price: number }>("https://api.stellar.expert/explorer/public/asset/XLM", { timeout: 8000 });
      if (data.price > 0) return data.price;
    } catch {
      /* fall through to Binance */
    }
    const { data } = await axios.get<{ price: string }>("https://api.binance.com/api/v3/avgPrice?symbol=XLMUSDT", { timeout: 8000 });
    return parseFloat(data.price);
  });
}

/** USD per platform token. Wadzzo is pegged at one cent (as the old flow assumed). */
export function platformUsd() {
  if (PLATFORM_ASSET.code.toLowerCase() === "wadzzo" || !env.NEXT_PUBLIC_STELLAR_PUBNET) return Promise.resolve(0.01);
  return cached("platform", async () => {
    const { data } = await axios.get<{ price?: number }>(
      `https://api.stellar.expert/explorer/public/asset/${PLATFORM_ASSET.code}-${PLATFORM_ASSET.issuer}`,
      { timeout: 8000 },
    );
    return data.price ?? 0.01;
  });
}

const up = (n: number, dp = 7) => Math.ceil(n * 10 ** dp) / 10 ** dp;

/** Platform tokens worth `xlm` XLM (rounded up so the payer never under-pays). */
export async function xlmToPlatform(xlm: number) {
  if (xlm <= 0) return 0;
  return up((xlm * (await xlmUsd())) / (await platformUsd()), 2);
}

/** XLM worth `tokens` platform tokens (rounded up to the stroop). */
export async function platformToXlm(tokens: number) {
  if (tokens <= 0) return 0;
  return up((tokens * (await platformUsd())) / (await xlmUsd()));
}

/** USD worth `tokens` platform tokens (rounded up to the cent). */
export async function platformToUsd(tokens: number) {
  if (tokens <= 0) return 0;
  return up(tokens * (await platformUsd()), 2);
}
