import React from "react";
import { signIn } from "next-auth/react";
import { hashPassword } from "~/utils/hash";

export default function TestPage() {
  function handleClick(): void {
    NextLogin("test3", "test").catch(() => console.log("err"));
  }

  return (
    <div>
      TestPage
      <button onClick={() => handleClick()}>Login</button>
    </div>
  );
}

export async function NextLogin(pubkey: string, password: string) {
  const hashedPassword = await hashPassword(password);
  const response = await signIn("credentials", {
    pubkey,
    password: hashedPassword,
    redirect: false,
  });

  console.log({ response });
}
