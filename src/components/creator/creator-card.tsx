"use client";

import { BadgeCheck, ExternalLink, Share2, Store } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

import { env } from "~/env";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { creatorHref } from "~/lib/creator";
import { cn } from "~/lib/utils";
import { Avatar } from "~/ui/person";
import { Skeleton } from "~/ui/skeleton";
import { api, type RouterOutputs } from "~/utils/api";

import { FollowButton } from "./creator-actions";

type CreatorCardData = RouterOutputs["creator"]["list"]["items"][number];

/**
 * A brand as a poster, like the bounty cards: the cover fills the card behind
 * a dark scrim, with the avatar, name, bio and counts on top and Follow /
 * Share at the bottom. The whole card links to the brand; the actions sit
 * above that link.
 */
export function CreatorCard({ creator, className }: { creator: CreatorCardData; className?: string }) {
  const href = creatorHref(creator);
  const { signedIn, session } = useRequireAuth();
  const following = api.creator.following.useQuery(undefined, { enabled: signedIn });
  const isFollowing = Boolean(following.data?.some((f) => f.creator.id === creator.id));
  const mine = session?.user.id === creator.id;
  const portal = env.NEXT_PUBLIC_BRAND_PORTAL_URL.replace(/\/$/, "");

  const share = async () => {
    const url = new URL(href, window.location.origin).toString();
    if (navigator.share) await navigator.share({ title: creator.name, url }).catch(() => undefined);
    else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };

  return (
    <article
      className={cn(
        "group relative isolate flex min-h-60 flex-col overflow-hidden rounded-2xl bg-surface-2 p-5 text-white ring-1 ring-foreground/10 transition-all duration-300 hover:glow hover:-translate-y-1",
        className,
      )}
    >
      {/* background */}
      {creator.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={creator.coverUrl} alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-700 group-hover:scale-110" />
      ) : (
        <div className="absolute inset-0 -z-10 flex items-center justify-center bg-black bg-[radial-gradient(circle_at_25%_20%,hsl(var(--primary)/0.55),transparent_60%),radial-gradient(circle_at_80%_75%,hsl(190_90%_45%/0.45),transparent_60%)]">
          <Store className="size-20 text-white/20" />
        </div>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/50 via-black/60 to-black/85" />

      {/* identity — the name's link stretches over the whole card */}
      <div className="flex items-center gap-3">
        <span className="shrink-0 rounded-full bg-gradient-to-tr from-primary via-green-hot to-cyan-400 p-[2px]">
          <Avatar src={creator.profileUrl} name={creator.name} className="size-14 border-2 border-black text-lg" />
        </span>
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 font-hud text-lg font-bold leading-snug">
            <Link href={href} className="truncate after:absolute after:inset-0 focus-visible:outline-none">
              {creator.name}
            </Link>
            <BadgeCheck className="size-4 shrink-0 text-[hsl(112_85%_62%)]" />
          </h3>
          {creator.pageAsset && <p className="text-xs font-semibold text-[hsl(112_70%_70%)]">${creator.pageAsset.code}</p>}
        </div>
      </div>

      <p className="mt-4 line-clamp-2 flex-1 break-words text-sm leading-relaxed text-white/70">{creator.bio?.trim() ? creator.bio : "No bio yet."}</p>

      {/* counts + actions */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm text-white/75">
          <span className="font-semibold tabular-nums text-white">{creator._count.followers.toLocaleString("en-US")}</span> followers ·{" "}
          <span className="font-semibold tabular-nums text-white">{creator._count.posts.toLocaleString("en-US")}</span> posts
        </p>
        <div className="relative z-10 flex shrink-0 items-center gap-1 text-sm font-semibold">
          {mine ? (
            <a href={portal} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[hsl(112_85%_62%)] transition-colors hover:bg-white/10">
              <ExternalLink className="size-4" /> Manage
            </a>
          ) : signedIn && !following.data ? (
            <Skeleton className="h-8 w-24 rounded-full bg-white/10" />
          ) : (
            <FollowButton key={String(isFollowing)} creatorId={creator.id} initial={isFollowing} className="h-8 px-3 text-xs shadow-none" />
          )}
          <span className="h-4 w-px bg-white/25" aria-hidden />
          <button type="button" onClick={() => void share()} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white">
            <Share2 className="size-4" /> Share
          </button>
        </div>
      </div>
    </article>
  );
}

export function CreatorCardSkeleton() {
  return <Skeleton className="min-h-60 rounded-2xl" />;
}
