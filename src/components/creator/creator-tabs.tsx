"use client";

import { Coins, Images, Newspaper } from "lucide-react";

import { ListingCard, ListingGrid } from "~/components/market/listing-card";
import { LoadMoreListings } from "~/components/market/load-more";
import { PostCard } from "~/components/post/post-card";
import { Button } from "~/components/shadcn/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/shadcn/ui/tabs";
import type { ListingCard as ListingCardData } from "~/server/api/routers/market";
import { EmptyState } from "~/ui/empty-state";
import { Skeleton } from "~/ui/skeleton";
import { api, type RouterOutputs } from "~/utils/api";

import { MembershipSection } from "./creator-actions";

type Profile = RouterOutputs["creator"]["profile"];
type Offer = RouterOutputs["market"]["pageTokenSales"][number];

/** A creator's page body: their items, their posts, their membership. */
export function CreatorTabs({
  profile,
  listings,
  nextCursor,
  offers,
}: {
  profile: Profile;
  listings: ListingCardData[];
  nextCursor: number | null;
  offers: Offer[];
}) {
  return (
    <Tabs defaultValue="items">
      <TabsList className="glass h-11 w-full justify-start gap-1 rounded-xl p-1 sm:w-auto">
        <TabsTrigger value="items" className="gap-1.5 rounded-lg px-4">
          <Images className="size-4" /> Items
        </TabsTrigger>
        <TabsTrigger value="posts" className="gap-1.5 rounded-lg px-4">
          <Newspaper className="size-4" /> Posts
        </TabsTrigger>
        <TabsTrigger value="membership" className="gap-1.5 rounded-lg px-4">
          <Coins className="size-4" /> Membership
        </TabsTrigger>
      </TabsList>

      <TabsContent value="items" className="mt-5">
        {listings.length === 0 ? (
          <EmptyState icon={Images} title="No items yet" description={`${profile.name} hasn't listed anything yet.`} />
        ) : (
          <div className="space-y-4">
            <ListingGrid>
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </ListingGrid>
            {nextCursor && <LoadMoreListings input={{ kind: "all", creatorId: profile.id, limit: 24 }} cursor={nextCursor} />}
          </div>
        )}
      </TabsContent>

      <TabsContent value="posts" className="mt-5">
        <CreatorPosts creatorId={profile.id} name={profile.name} />
      </TabsContent>

      <TabsContent value="membership" className="mt-5">
        <MembershipSection profile={profile} offers={offers} />
      </TabsContent>
    </Tabs>
  );
}

function CreatorPosts({ creatorId, name }: { creatorId: string; name: string }) {
  const q = api.post.feed.useInfiniteQuery({ creatorId, limit: 10 }, { getNextPageParam: (p) => p.nextCursor });
  const posts = q.data?.pages.flatMap((p) => p.items) ?? [];
  if (q.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (!posts.length) return <EmptyState icon={Newspaper} title="No posts yet" description={`${name} hasn't posted yet.`} />;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
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
    </div>
  );
}
