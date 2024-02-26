import { z } from "zod";
import { signXdrTransaction } from "./wallete/signXDR";
import { getAccSecret } from "package/connect_wallet";

export const SignUser = z
  .object({ uid: z.string(), email: z.string() })
  .optional();
export type SignUserType = z.TypeOf<typeof SignUser>;

export async function WithSing({
  xdr,
  signWith,
}: {
  xdr: string;
  signWith: SignUserType;
}) {
  if (signWith) {
    const secret = await getAccSecret(signWith.uid, signWith.email);
    return signXdrTransaction(xdr, secret);
  } else return xdr;
}
