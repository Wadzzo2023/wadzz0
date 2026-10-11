"use client";

import { Newspaper, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "~/components/shadcn/ui/button";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { cn } from "~/lib/utils";
import { EmptyState } from "~/ui/empty-state";
import { Skeleton } from "~/ui/skeleton";
import { api } from "~/utils/api";

import { PostCard } from "./post-card";

/** The feed: everything, or just the brands you follow. */
export function FeedView() {
  const { signedIn, openSignIn } = useRequireAuth();
  const [scope, setScope] = useState<"all" | "following">("all");
  const q = api.post.feed.useInfiniteQuery({ scope, limit: 10 }, { getNextPageParam: (p) => p.nextCursor });
  const posts = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="glass flex gap-1 rounded-xl p-1" role="tablist">
        {(["all", "following"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={scope === s}
            onClick={() => (s === "following" && !signedIn ? openSignIn() : setScope(s))}
            className={cn("h-9 flex-1 rounded-lg text-sm font-semibold transition-colors", scope === s ? "bg-primary text-primary-foreground shadow-[0_0_20px_-6px_hsl(var(--primary)/0.8)]" : "text-muted-foreground hover:text-foreground")}
          >
            {s === "all" ? "For you" : "Following"}
          </button>
        ))}
      </div>

      {q.isLoading ? (
        [0, 1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)
      ) : !posts.length ? (
        scope === "following" ? (
          <EmptyState icon={Sparkles} title="Follow a few brands" description="Posts from brands you follow show up here." action={<Button asChild><Link href="/creators">Find creators</Link></Button>} />
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
              <Button variant="outline" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
                {q.isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
