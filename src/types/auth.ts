import { WalletType } from "package/connect_wallet";
import { z } from "zod";

const albedoSchema = z.object({
  walletType: z.literal(WalletType.albedo),
  pubkey: z.string(),
});

const emailPassSchema = z.object({
  walletType: z.literal(WalletType.emailPass),
  email: z.string(),
  password: z.string(),
});

export const authCredentialSchema = z.union([albedoSchema, emailPassSchema]);

export type AuthCredentialType = z.infer<typeof authCredentialSchema>;
