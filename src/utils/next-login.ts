import { signIn } from "next-auth/react";
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
