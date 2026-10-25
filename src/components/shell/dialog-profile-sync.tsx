"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

import { useDialogStore } from "package/connect_wallet/src/state/connect_wallet_dialog";
import { api } from "~/utils/api";

/** Gives the sign-in dialog's profile card this user's avatar and cover photo (not in the session). */
export function DialogProfileSync() {
  const { status } = useSession();
  const me = api.user.me.useQuery(undefined, {
    enabled: status === "authenticated",
    staleTime: 5 * 60_000,
  });
  const setProfile = useDialogStore((s) => s.setProfile);

  useEffect(() => {
    setProfile(status === "authenticated" && me.data ? { name: me.data.name, image: me.data.image, coverImage: me.data.coverImage } : null);
  }, [status, me.data, setProfile]);

  return null;
}
