import { Asset } from "stellar-sdk";
import { env } from "~/env";

export const SITE_ASSET_OBJ = {
  asset_code: env.NEXT_PUBLIC_SITE_ASSET_CODE,
  asset_issuer: env.NEXT_PUBLIC_SITE_ASSET_ISSUER,
};

export const SITE_ASSET = new Asset(
  SITE_ASSET_OBJ.asset_code,
  SITE_ASSET_OBJ.asset_issuer,
);
