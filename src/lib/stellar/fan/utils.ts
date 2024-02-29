import { z } from "zod";
import { env } from "~/env";

export const AccountSchema = z.object({
  publicKey: z.string(),
  secretKey: z.string(),
});

export type AccountType = z.infer<typeof AccountSchema>;

export const AssetSchema = z.object({
  code: z.string(),
  issuer: z.string(),
});

export type MyAssetType = z.infer<typeof AssetSchema>;

export function clientSelect() {
  if (env.NEXT_PUBLIC_STELLAR_PUBNET) return undefined;
  else return true;
}
