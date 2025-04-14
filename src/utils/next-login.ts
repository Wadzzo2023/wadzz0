import { signIn } from "next-auth/react";
import { z } from "zod";
import {
  AuthCredentialType,
  albedoSchema,
  appleAuthSchema,
  providerAuthShema,
  walleteAuthSchema,
} from "~/types/auth";
import { hashPassword } from "~/utils/hash";

export async function NextLogin(pubkey: string, password: string) {
  const hashedPassword = await hashPassword(password);
  const response = await signIn("credentials", {
    pubkey,
    password: hashedPassword,
    redirect: false,
  });

  // console.log({ response });
}

export async function AlbedoNextLogin({
  pubkey,
  signature,
  token,
  walletType,
}: z.infer<typeof albedoSchema>) {
  const response = await signIn("credentials", {
    pubkey,
    signature,
    token,
    walletType,
    redirect: false,
  } as AuthCredentialType);
  return response;
}

export async function WalleteNextLogin({
  pubkey,
  signedXDR,
  walletType,
}: z.infer<typeof walleteAuthSchema>) {
  const response = await signIn("credentials", {
    pubkey,
    walletType,
    signedXDR,
    redirect: false,
  } as AuthCredentialType);

  // console.log({ response });
  return response;
}

export async function ProviderNextLogin({
  token,
  walletType,
  email,
}: z.infer<typeof providerAuthShema>) {
  const response = await signIn("credentials", {
    email,
    token,
    walletType,
    redirect: false,
  } as AuthCredentialType);
  return response;
}

export async function ProviderAppleLogin({
  appleToken,
  token,
  walletType,
  email,
}: z.infer<typeof appleAuthSchema>) {
  const response = await signIn("credentials", {
    token,
    email,
    appleToken,
    walletType,
    redirect: false,
  } as AuthCredentialType);
  return response;
}
