"use client";

import { formatDistanceToNow } from "date-fns";
import { BadgeCheck, Crown, ExternalLink, Lock, Newspaper } from "lucide-react";
import Link from "next/link";

import { FollowButton } from "~/components/creator/creator-actions";
import { tierColor } from "~/components/creator/tier-card";
import { Button } from "~/components/shadcn/ui/button";
import { env } from "~/env";
import { creatorHref } from "~/lib/creator";
import { cn } from "~/lib/utils";
import { Avatar } from "~/ui/person";
import type { RouterOutputs } from "~/utils/api";

import type { PostData } from "./post-card";

type Profile = RouterOutputs["creator"]["profile"];

/** Beside a single post: who posted it, what unlocks it (if gated), and more from the same brand. */
export function PostSidebar({ post, profile, more }: { post: PostData; profile: Profile; more: PostData[] }) {
  const href = creatorHref(profile);
  const portal = env.NEXT_PUBLIC_BRAND_PORTAL_URL.replace(/\/$/, "");
  const tier = post.subscription ? profile.subscriptions.find((t) => t.id === post.subscription?.id) : null;

  return (
    <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
      {/* brand */}
      <section className="glass overflow-hidden rounded-[1.6rem]">
        <div className="h-20 bg-primary/25">
          {profile.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.coverUrl} alt="" className="size-full object-cover opacity-90" />
          ) : (
            <div className="size-full bg-primary/20" />
          )}
        </div>
        <div className="space-y-3 p-4 pt-0">
          <Link href={href} className="-mt-7 flex items-start gap-3">
            <span className="shrink-0 rounded-full bg-primary p-[2px]">
              <Avatar src={profile.profileUrl} name={profile.name} className="size-14 border-2 border-background text-lg" />
            </span>
            <span className="min-w-0 pt-8">
              <span className="display flex items-center gap-1 text-2xl">
                <span className="truncate">{profile.name}</span>
                <BadgeCheck className="size-4 shrink-0 text-primary" />
              </span>
              <span className="block text-xs text-muted-foreground">
                {profile.counts.followers.toLocaleString("en-US")} follower{profile.counts.followers === 1 ? "" : "s"} · {profile.counts.posts.toLocaleString("en-US")} post
                {profile.counts.posts === 1 ? "" : "s"}
              </span>
            </span>
          </Link>
          {profile.bio?.trim() && <p className="line-clamp-3 break-words text-sm text-muted-foreground">{profile.bio}</p>}
          {profile.viewer.isSelf ? (
            <Button asChild variant="outline" className="w-full">
              <a href={`${portal}/posts/${post.id}`} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" /> Edit in brand portal
              </a>
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <FollowButton creatorId={profile.id} initial={profile.viewer.following} className="w-full" />
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link href={href}>View page</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* what unlocks a gated post */}
      {post.subscription && (
        <section className="glass space-y-3 rounded-[1.6rem] p-4">
          <div className="flex items-center gap-2">
            <span className={cn("h-8 w-1 rounded-full", tierColor(post.subscription.color).bar)} />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Members-only</p>
              <p className="display truncate text-2xl">{post.subscription.name}</p>
            </div>
            {post.locked ? <Lock className="ml-auto size-4 text-muted-foreground" /> : <Crown className="ml-auto size-4 text-primary" />}
          </div>
          <p className="text-sm text-muted-foreground">
            {post.locked
              ? `Hold ${(tier?.price ?? post.subscription.price).toLocaleString("en-US")} ${profile.pageAsset?.code ?? "page tokens"} to read this and every ${post.subscription.name} post.`
              : profile.viewer.isSelf
                ? "Only members of this tier can read this post."
                : `You're in — your ${profile.pageAsset?.code ?? "page token"} balance unlocks this tier.`}
          </p>
          {post.locked && (
            <Button asChild className="w-full">
              <Link href={`${href}?tab=membership`}>
                <Crown className="size-4" /> Join membership
              </Link>
            </Button>
          )}
        </section>
      )}

      {/* more from this brand */}
      {more.length > 0 && (
        <section className="glass space-y-2 rounded-[1.6rem] p-4">
          <div className="flex items-center justify-between">
            <h2 className="display text-2xl">More from {profile.name}</h2>
            <Link href={`${href}?tab=posts`} className="text-xs font-medium text-primary hover:underline">
              See all
            </Link>
          </div>
          <ul className="space-y-1">
            {more.map((p) => {
              const thumb = p.medias.find((m) => m.type === "IMAGE")?.url;
              return (
                <li key={p.id}>
                  <Link href={`/posts/${p.id}`} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-foreground/[0.04]">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="flex size-11 shrink-0 items-center justify-center blob bg-primary text-primary-foreground">
                        {p.locked ? <Lock className="size-4" /> : <Newspaper className="size-4" />}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="line-clamp-1 text-sm font-semibold">{p.heading}</span>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </aside>
  );
}
