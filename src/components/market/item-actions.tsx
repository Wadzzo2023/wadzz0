"use client";

import { ExternalLink, Lock, Share2, Unlock } from "lucide-react";
import toast from "react-hot-toast";

import { useRequireAuth } from "~/hooks/use-require-auth";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

/** Under the art: whether the viewer owns it (content unlocked or not), share, and the token on Stellar. */
export function ItemActions({ assetId, name, explorerUrl }: { assetId: number; name: string; explorerUrl: string }) {
  const { signedIn } = useRequireAuth();
  const access = api.content.access.useQuery({ assetId }, { enabled: signedIn });
  const owner = access.data?.owner === true;

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: name, url }).catch(() => undefined);
    else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };

  const btn = "glass flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground";
  return (
    <div className="flex items-center gap-2">
      <div className={cn("glass flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl px-3 text-sm", owner && "border-primary/40")}>
        {owner ? <Unlock className="size-4 shrink-0 text-primary" /> : <Lock className="size-4 shrink-0 text-muted-foreground" />}
        <span className="truncate">
          {owner ? <span className="font-semibold text-primary">You own this · content unlocked</span> : "Locked · own a copy to unlock the full content"}
        </span>
      </div>
      <button type="button" onClick={() => void share()} className={btn} aria-label="Share">
        <Share2 className="size-4" />
      </button>
      <a href={explorerUrl} target="_blank" rel="noreferrer" className={btn} aria-label="View on Stellar">
        <ExternalLink className="size-4" />
      </a>
    </div>
  );
}
