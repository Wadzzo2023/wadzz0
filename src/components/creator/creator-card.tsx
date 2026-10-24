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
 * A brand as a poster: the cover (or logo) fills the card, and the avatar,
 * name, bio, fan and post counts and Follow / Share sit on a dark fade. The
 * whole card links to the brand; the actions sit above that link.
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

  const bg = creator.coverUrl ?? creator.profileUrl;

  return (
    <article
      className={cn(
        "on-dark group relative isolate flex min-h-[22rem] flex-col overflow-hidden rounded-[1.4rem] border-2 border-foreground/10 bg-surface-3 p-4 text-white",
        "transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:-rotate-1 hover:border-foreground hover:shadow-[6px_7px_0_0_hsl(var(--primary))]",
        className,
      )}
    >
      {/* the cover (or the logo) is the card's background */}
      {bg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bg} alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-500 group-hover:scale-105" />
      ) : (
        <div className="absolute inset-0 -z-10 flex items-center justify-center bg-primary/25">
          <Store className="size-24 text-primary/50" strokeWidth={1.6} />
        </div>
      )}
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-1/4 bg-gradient-to-b from-black/50 to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-[80%] bg-gradient-to-t from-black/95 via-black/75 to-transparent" />

      {creator.pageAsset && <span className="marker w-fit -rotate-3 self-end rounded-md bg-pink px-2 py-0.5 text-xs text-side-ink">${creator.pageAsset.code}</span>}

      {/* identity — the name's link stretches over the whole card */}
      <div className="mt-auto space-y-2 pt-10">
        <span className="block w-fit -rotate-3 rounded-full bg-primary p-[3px] transition-transform duration-200 group-hover:rotate-0">
          <Avatar src={creator.profileUrl} name={creator.name} className="size-16 border-2 border-black text-xl" />
        </span>
        <h3 className="display flex items-center gap-2 text-4xl leading-[0.95]">
          <Link href={href} className="min-w-0 truncate after:absolute after:inset-0 focus-visible:outline-none">
            {creator.name}
          </Link>
          <BadgeCheck className="size-6 shrink-0 text-primary" strokeWidth={2.6} />
        </h3>
        <p className="line-clamp-2 break-words text-sm leading-relaxed text-white/75">{creator.bio?.trim() ? creator.bio : "No bio yet."}</p>

        <div className="flex items-center justify-between gap-3 border-t-2 border-dashed border-white/20 pt-3">
          <p className="flex items-baseline gap-3 text-xs font-bold uppercase tracking-wider text-white/70">
            <span>
              <span className="display text-2xl text-white">{creator._count.followers.toLocaleString("en-US")}</span> fans
            </span>
            <span>
              <span className="display text-2xl text-white">{creator._count.posts.toLocaleString("en-US")}</span> posts
            </span>
          </p>
          <div className="relative z-10 flex shrink-0 items-center gap-1.5">
            {mine ? (
              <a href={portal} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-white/30 px-3 text-xs font-bold transition-colors hover:border-white">
                <ExternalLink className="size-3.5" /> Manage
              </a>
            ) : signedIn && !following.data ? (
              <Skeleton className="h-9 w-24 rounded-full bg-white/10" />
            ) : (
              <FollowButton key={String(isFollowing)} creatorId={creator.id} initial={isFollowing} className="h-9 px-4 text-xs" />
            )}
            <button type="button" onClick={() => void share()} aria-label="Share" className="flex size-9 items-center justify-center rounded-full bg-white text-black transition-transform hover:-rotate-12">
              <Share2 className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function CreatorCardSkeleton() {
  return <Skeleton className="min-h-[22rem] rounded-[1.4rem]" />;
}
