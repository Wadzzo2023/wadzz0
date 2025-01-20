import { WalletType } from "package/connect_wallet";
import { z } from "zod";

export const albedoSchema = z.object({
  walletType: z.literal(WalletType.albedo),
  pubkey: z.string(),
  signature: z.string(),
  token: z.string(),
  fromAppSign: z.string().optional(),

});

const emailPassSchema = z.object({
  walletType: z.literal(WalletType.emailPass),
  email: z.string(),
  password: z.string(),
  fromAppSign: z.string().optional(),

});

export const walleteAuthSchema = z.object({
  walletType: z.union([
    z.literal(WalletType.frieghter),
    z.literal(WalletType.rabet),
    z.literal(WalletType.walletConnect),
  ]),
  pubkey: z.string(),
  signedXDR: z.string(),
  fromAppSign: z.string().optional(),

});

export const providerAuthShema = z.object({
  email: z.string(),
  token: z.string(),
  walletType: z.union([
    z.literal(WalletType.google),
    z.literal(WalletType.facebook),
  ]),
  fromAppSign: z.string().optional(),

});

export const appleAuthSchema = z.object({
  walletType: z.literal(WalletType.apple),
  token: z.string().optional(),
  email: z.string(),
  appleToken: z.string().optional(),
  fromAppSign: z.string().optional(),

});

export const authCredentialSchema = z.union([
  albedoSchema,
  emailPassSchema,
  providerAuthShema,
  walleteAuthSchema,
  appleAuthSchema,
]);

export type AuthCredentialType = z.infer<typeof authCredentialSchema>;
