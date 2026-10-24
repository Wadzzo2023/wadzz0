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

  const btn = "flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:-rotate-12";
  return (
    <div className="flex items-center gap-2">
      <div className={cn("flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border-2 px-4 text-sm font-semibold", owner ? "border-primary bg-primary text-primary-foreground" : "border-foreground/12")}>
        {owner ? <Unlock className="size-4 shrink-0" strokeWidth={2.6} /> : <Lock className="size-4 shrink-0 text-muted-foreground" strokeWidth={2.6} />}
        <span className="truncate">
          {owner ? <span className="font-bold">You own this · content unlocked</span> : "Locked · own a copy to unlock it"}
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
