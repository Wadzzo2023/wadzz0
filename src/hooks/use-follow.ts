"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import { useSignAndConfirm } from "~/hooks/use-sign-and-confirm";
import { api } from "~/utils/api";

const CONFIRM_TRIES = 8;
const CONFIRM_WAIT_MS = 1500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type FollowStage = "idle" | "preparing" | "signing" | "confirming";

/**
 * Following a brand with a page token only counts once the wallet trusts that
 * token: the server prepares the trustline, the wallet signs it, and the follow
 * is saved only after the server has seen the trustline on Stellar (it can take
 * a few seconds to show up, so confirming retries briefly).
 * `run` resolves true once the follow is saved, false (after a toast) if not.
 */
export function useFollow() {
  const follow = api.creator.follow.useMutation();
  const confirm = api.creator.confirmFollow.useMutation();
  const sign = useSignAndConfirm();
  const [confirming, setConfirming] = useState(false);

  async function run(creatorId: string): Promise<boolean> {
    try {
      const res = await follow.mutateAsync({ creatorId });
      if (res.followed) return true;

      if (!(await sign.signOnly(res.xdr))) {
        toast.error("The trustline wasn't signed, so you're not following yet.");
        return false;
      }

      setConfirming(true);
      for (let i = 0; i < CONFIRM_TRIES; i++) {
        if ((await confirm.mutateAsync({ creatorId })).followed) return true;
        await sleep(CONFIRM_WAIT_MS);
      }
      toast.error("We couldn't see the trustline on Stellar yet, so you're not following. Try again in a moment.");
      return false;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't follow right now.");
      return false;
    } finally {
      setConfirming(false);
    }
  }

  const stage: FollowStage = sign.step === "signing" ? "signing" : confirming ? "confirming" : follow.isPending ? "preparing" : "idle";
  return { run, stage, busy: stage !== "idle" };
}
