import { Asset, Networks } from "@stellar/stellar-sdk";
import { env } from "~/env";

export const networkPassphrase = env.NEXT_PUBLIC_STELLAR_PUBNET
  ? Networks.PUBLIC
  : Networks.TESTNET;

export const STELLAR_URL = env.NEXT_PUBLIC_STELLAR_PUBNET
  ? "https://horizon.stellar.org"
  : "https://horizon-testnet.stellar.org";

export const PLATFORM_ASSET = new Asset(
  env.NEXT_PUBLIC_ASSET_CODE,
  env.NEXT_PUBLIC_ASSET_ISSUER,
);

export const PLATFORM_FEE = env.NEXT_PUBLIC_STELLAR_PUBNET ? "0.1" : "2";
