import { Networks } from "@stellar/stellar-sdk";
import { env } from "~/env";

export const HORIZON_URL = "https://horizon.stellar.org"; // Horizon server for pubnet

export const STROOP = "0.0000001";
export const DEFAULT_ASSET_PRICE = "1"; // siteAsset

export const networkPassphrase = env.NEXT_PUBLIC_STELLAR_PUBNET
  ? Networks.PUBLIC
  : Networks.TESTNET;

export const STELLAR_URL = env.NEXT_PUBLIC_STELLAR_PUBNET
  ? "https://horizon.stellar.org"
  : "https://horizon-testnet.stellar.org";

export const STORAGE_PUB = "test"; // env.NEXT_PUBLIC_STORAGE_PUB;
