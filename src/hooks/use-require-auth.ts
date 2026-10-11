"use client";

import { useSession } from "next-auth/react";
import { useDialogStore } from "package/connect_wallet/src/state/connect_wallet_dialog";
import { useCallback } from "react";

/**
 * Browsing is open to everyone; actions need an account. Wrap any action in
 * `requireAuth(fn)`: signed in → it runs; signed out → the sign-in dialog opens.
 */
export function useRequireAuth() {
  const session = useSession();
  const openSignIn = useDialogStore((s) => s.setIsOpen);
  const signedIn = session.status === "authenticated";

  const requireAuth = useCallback(
    <A extends unknown[]>(fn: (...args: A) => void) =>
      (...args: A) => {
        if (signedIn) fn(...args);
        else openSignIn(true);
      },
    [signedIn, openSignIn],
  );

  return { signedIn, loading: session.status === "loading", session: session.data, requireAuth, openSignIn: () => openSignIn(true) };
}
