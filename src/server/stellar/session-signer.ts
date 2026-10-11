import "server-only";

import type { Session } from "next-auth";
import { isCustodial } from "~/lib/custodial";

import type { Signer } from "./keys";

/** Custodial (email/social) users are signed for by the server; wallet users sign in the browser. */
export function signerFor(session: Session): Signer {
  const { walletType, email } = session.user;
  return isCustodial(walletType) && email ? { email } : undefined;
}
