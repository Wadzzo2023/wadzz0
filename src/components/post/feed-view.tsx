"use client";

import { ArrowRight, Newspaper, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { creatorHref } from "~/components/creator/creator-card";
import { FollowButton } from "~/components/creator/creator-actions";
import { Button } from "~/components/shadcn/ui/button";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { cn } from "~/lib/utils";
import { EmptyState } from "~/ui/empty-state";
import { Avatar } from "~/ui/person";
import { Skeleton } from "~/ui/skeleton";
import { api, type RouterOutputs } from "~/utils/api";

import { Composer } from "./composer";
import { PostCard } from "./post-card";

type Creator = RouterOutputs["creator"]["list"]["items"][number];

const SCOPES = [
  { id: "all", label: "For you" },
  { id: "following", label: "Following" },
] as const;
type Scope = (typeof SCOPES)[number]["id"];

/** The feed: a composer for brands, For you / Following, the posts, and brands to follow on the side. */
export function FeedView({ suggested }: { suggested: Creator[] }) {
  const { signedIn, openSignIn } = useRequireAuth();
  const [scope, setScope] = useState<Scope>("all");
  const q = api.post.feed.useInfiniteQuery({ scope, limit: 10 }, { getNextPageParam: (p) => p.nextCursor });
  const posts = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="mx-auto w-full max-w-2xl space-y-5 lg:mx-0 lg:max-w-none">
        <Composer />

        <div className="glass flex w-fit gap-1 rounded-xl p-1" role="tablist">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={scope === s.id}
              onClick={() => (s.id === "following" && !signedIn ? openSignIn() : setScope(s.id))}
              className={cn(
                "flex h-9 items-center rounded-lg px-4 text-sm font-semibold transition-colors",
                scope === s.id ? "bg-primary text-primary-foreground shadow-[0_0_20px_-6px_hsl(var(--primary)/0.8)]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {q.isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)
        ) : !posts.length ? (
          scope === "following" ? (
            <EmptyState
              icon={Sparkles}
              title="Follow a few brands"
              description="Posts from brands you follow show up here."
              action={
                <Button asChild className="rounded-xl">
                  <Link href="/creators">Find creators</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState icon={Newspaper} title="No posts yet" description="Check back soon." />
          )
        ) : (
          <>
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
            {q.hasNextPage && (
              <div className="flex justify-center">
                <Button variant="outline" className="rounded-xl" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
                  {q.isFetchingNextPage ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {suggested.length > 0 && (
        <aside className="hidden lg:block">
          <BrandsToFollow creators={suggested} />
        </aside>
      )}
    </div>
  );
}

/** Top brands with a Follow button; ones the viewer already follows show as Following. */
function BrandsToFollow({ creators }: { creators: Creator[] }) {
  const { signedIn, session } = useRequireAuth();
  const following = api.creator.following.useQuery(undefined, { enabled: signedIn });
  const followed = new Set(following.data?.map((f) => f.creator.id));
  const list = creators.filter((c) => c.id !== session?.user.id);
  if (!list.length) return null;

  return (
    <section className="glass sticky top-24 space-y-3 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-hud font-bold">Brands to follow</h2>
        <Link href="/creators" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          See all <ArrowRight className="size-3" />
        </Link>
      </div>
      <ul className="space-y-1">
        {list.map((c) => (
          <li key={c.id} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-foreground/[0.04]">
            <Link href={creatorHref(c)} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar src={c.profileUrl} name={c.name} className="size-10" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{c.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {c._count.followers.toLocaleString("en-US")} followers · {c._count.posts.toLocaleString("en-US")} posts
                </span>
              </span>
            </Link>
            {(!signedIn || following.data) && (
              <FollowButton key={`${c.id}-${followed.has(c.id)}`} creatorId={c.id} initial={followed.has(c.id)} className="h-8 shrink-0 px-3 text-xs shadow-none" />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
