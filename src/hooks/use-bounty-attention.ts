import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { api } from "~/utils/api";
import { useRequireAuth } from "~/hooks/use-require-auth";

/**
 * ── Bounty attention ───────────────────────────────────────────────────────
 *
 * "Something on a bounty needs you": you won one, or the brand replied in
 * your chat. Drives the dot on the Bounty tab and on the profile avatar, and
 * the "Needs you" row at the top of /bounty.
 *
 * Read state is per device. There is no read-receipt column in the shared
 * schema, and adding one for a dot isn't worth a migration against the
 * database wadzz0 also owns — so the server reports *when* each event
 * happened (`bounty.attention`) and this store remembers, per bounty, the
 * last time the viewer opened it. Anything newer than that is unseen.
 */

interface SeenState {
  seen: Record<number, string>;
  markSeen: (bountyId: number) => void;
}

export const useBountySeen = create<SeenState>()(
  persist(
    (set) => ({
      seen: {},
      markSeen: (bountyId) =>
        set((s) => ({
          seen: { ...s.seen, [bountyId]: new Date().toISOString() },
        })),
    }),
    { name: "wadzzo-bounty-seen" },
  ),
);

export function useBountyAttention() {
  const { signedIn } = useRequireAuth();
  const seen = useBountySeen((s) => s.seen);
  const query = api.bounty.attention.useQuery(undefined, {
    enabled: signedIn,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const unseen = useMemo(
    () =>
      (query.data ?? []).filter((item) => {
        const last = seen[item.bountyId];
        return !last || new Date(item.at).getTime() > new Date(last).getTime();
      }),
    [query.data, seen],
  );

  // `ready` so a screen can tell "nothing unseen" from "not loaded yet".
  return {
    unseen,
    count: unseen.length,
    ready: !signedIn || query.isSuccess,
  };
}
