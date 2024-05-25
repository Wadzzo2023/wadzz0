import { WalletType } from "package/connect_wallet";
import { z } from "zod";

export const albedoSchema = z.object({
  walletType: z.literal(WalletType.albedo),
  pubkey: z.string(),
  signature: z.string(),
  token: z.string(),
});

const emailPassSchema = z.object({
  walletType: z.literal(WalletType.emailPass),
  email: z.string(),
  password: z.string(),
});

export const rabetAuthSchema = z.object({
  walletType: z.literal(WalletType.rabet),
  pubkey: z.string(),
  signedXDR: z.string(),
});

export const providerAuthShema = z.object({
  email: z.string(),
  token: z.string(),
  walletType: z.union([
    z.literal(WalletType.google),
    z.literal(WalletType.facebook),
  ]),
});

export const authCredentialSchema = z.union([
  albedoSchema,
  emailPassSchema,
  providerAuthShema,
  rabetAuthSchema,
]);

export type AuthCredentialType = z.infer<typeof authCredentialSchema>;
