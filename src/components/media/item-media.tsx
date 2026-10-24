"use client";

import type { MediaType } from "@prisma/client";
import { Lock } from "lucide-react";

import { useRequireAuth } from "~/hooks/use-require-auth";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

import { MEDIA_META } from "./media-meta";
import { MediaPlayer } from "./media-player";

/**
 * An item's content: playable for owners, otherwise its thumbnail behind a
 * lock (the file itself is never sent to non-owners).
 */
export function ItemMedia({
  assetId,
  name,
  thumbnail,
  mediaType,
  className,
}: {
  assetId: number;
  name: string;
  thumbnail: string;
  mediaType: MediaType;
  className?: string;
}) {
  const { signedIn } = useRequireAuth();
  const access = api.content.access.useQuery({ assetId }, { enabled: signedIn });
  const owner = access.data?.owner === true;
  const content = api.content.unlock.useQuery({ assetId }, { enabled: owner, staleTime: 5 * 60_000 });

  if (owner && content.data) {
    return <MediaPlayer type={content.data.mediaType} url={content.data.mediaUrl} poster={content.data.thumbnail} title={content.data.name} className={className} />;
  }
  return <LockedPreview name={name} thumbnail={thumbnail} mediaType={mediaType} checking={signedIn && (access.isLoading || (owner && content.isLoading))} className={className} />;
}

export function LockedPreview({
  name,
  thumbnail,
  mediaType,
  checking,
  className,
}: {
  name: string;
  thumbnail: string;
  mediaType: MediaType;
  checking?: boolean;
  className?: string;
}) {
  const meta = MEDIA_META[mediaType];
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-surface-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumbnail} alt={name} className="aspect-square w-full object-cover" />
      <div className="blob absolute inset-x-3 bottom-3 flex items-center gap-2.5 bg-side-ink/95 p-2.5 text-side-mint">
        <span className="flex size-9 items-center justify-center rounded-full bg-side text-side-ink">
          {checking ? <span className="loading-spinner loading-sm" /> : <Lock className="size-4" />}
        </span>
        <span className="text-sm leading-tight">
          <span className="marker block text-sm">{checking ? "Checking ownership…" : `${meta.label} unlocks for owners`}</span>
          {!checking && <span className="block text-xs text-side-mint/70">Own a copy to play the full content</span>}
        </span>
      </div>
    </div>
  );
}
