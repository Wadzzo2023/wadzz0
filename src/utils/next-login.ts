import { signIn } from "next-auth/react";
import { z } from "zod";
import { AuthCredentialType, albedoSchema } from "~/types/auth";
import { hashPassword } from "~/utils/hash";

export async function NextLogin(pubkey: string, password: string) {
  const hashedPassword = await hashPassword(password);
  const response = await signIn("credentials", {
    pubkey,
    password: hashedPassword,
    redirect: false,
  });

  console.log({ response });
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
