import { Asset, Networks } from "@stellar/stellar-sdk";
import { env } from "~/env";

export const STROOP = "0.0000001";

export const networkPassphrase = env.NEXT_PUBLIC_STELLAR_PUBNET
  ? Networks.PUBLIC
  : Networks.TESTNET;

export const STELLAR_URL = env.NEXT_PUBLIC_STELLAR_PUBNET
  ? "https://horizon.stellar.org"
  : "https://horizon-testnet.stellar.org";

export const PLATFROM_ASSET = new Asset(
  env.NEXT_PUBLIC_ASSET_CODE,
  env.NEXT_PUBLIC_ASSET_ISSUER,
);

export const PLATFROM_FEE = env.NEXT_PUBLIC_STELLAR_PUBNET ? "500" : "2";
