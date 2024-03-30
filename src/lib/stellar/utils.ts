import { z } from "zod";
import { signXdrTransaction } from "./fan/signXDR";
import { getAccSecret } from "package/connect_wallet";
import { env } from "~/env";

export const SignUser = z
  .object({ uid: z.string(), email: z.string() })
  .optional()
  .or(z.object({ isAdmin: z.boolean() }));
export type SignUserType = z.TypeOf<typeof SignUser>;

export async function WithSing({
  xdr,
  signWith,
}: {
  xdr: string;
  signWith?: SignUserType;
}) {
  if (signWith) {
    if ("uid" in signWith && "email" in signWith) {
      const secret = await getAccSecret(signWith.uid, signWith.email);
      return signXdrTransaction(xdr, secret);
    }
    if ("isAdmin" in signWith) {
      return signXdrTransaction(xdr, env.MOTHER_SECRET);
    }
  }
  return xdr;
}
