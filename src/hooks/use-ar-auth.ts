"use client";

import { useSession } from "next-auth/react";
import { useDialogStore } from "package/connect_wallet/src/state/connect_wallet_dialog";

type ArAuth = { user: { id: string } | null; requireAuth: (intent?: string) => boolean };

/**
 * The slice of wadzzoAR's auth store its bounty screens use, backed by this
 * app's session: `requireAuth` opens the sign-in dialog and returns false
 * when signed out.
 */
export function useAuth<T>(select: (s: ArAuth) => T): T {
  const session = useSession();
  const openSignIn = useDialogStore((s) => s.setIsOpen);
  const user = session.data?.user.id ? { id: session.data.user.id } : null;
  return select({
    user,
    requireAuth: () => {
      if (user) return true;
      openSignIn(true);
      return false;
    },
  });
}
