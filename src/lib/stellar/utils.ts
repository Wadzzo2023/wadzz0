import { getAccSecretFromRubyApi } from "package/connect_wallet/src/lib/stellar/get-acc-secret";
import { z } from "zod";
import { env } from "~/env";
import { signXdrTransaction } from "./fan/signXDR";

export const SignUser = z
  .object({ email: z.string() })
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
    if ("email" in signWith) {
      // i don't have the uid and email
      const secret = await getAccSecretFromRubyApi(signWith.email);

      return signXdrTransaction(xdr, secret);
    }
    if ("isAdmin" in signWith) {
      return signXdrTransaction(xdr, env.MOTHER_SECRET);
    }
  }
  return xdr;
}
