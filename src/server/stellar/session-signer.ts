import "server-only";

import type { Session } from "next-auth";
import { WalletType } from "package/connect_wallet/src/lib/enums";

import type { Signer } from "./keys";

const CUSTODIAL = new Set<WalletType>([WalletType.emailPass, WalletType.google, WalletType.facebook, WalletType.apple]);

/** Custodial (email/social) users are signed for by the server; wallet users sign in the browser. */
export function signerFor(session: Session): Signer {
  const { walletType, email } = session.user;
  return CUSTODIAL.has(walletType) && email ? { email } : undefined;
}
