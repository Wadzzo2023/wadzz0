import { z } from "zod";

export const AccounSchema = z.object({
  publicKey: z.string(),
  secretKey: z.string(),
});

export type AccountType = z.infer<typeof AccounSchema>;

export const AssetSchema = z.object({
  code: z.string(),
  issuer: z.string(),
});

export type MyAssetType = z.infer<typeof AssetSchema>;