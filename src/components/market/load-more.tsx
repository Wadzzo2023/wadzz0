"use client";

import { Button } from "~/components/shadcn/ui/button";
import type { ListingsInput } from "~/server/api/routers/market";
import { api } from "~/utils/api";

import { ListingCard, ListingCardSkeleton, ListingGrid } from "./listing-card";

/** Pages after the first (the first is rendered on the server). */
export function LoadMoreListings({ input, cursor }: { input: ListingsInput; cursor: number }) {
  const q = api.market.listings.useInfiniteQuery(input, { initialCursor: cursor, getNextPageParam: (p) => p.nextCursor, enabled: false });
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  const hasMore = q.data ? q.hasNextPage : true;

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <ListingGrid>
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </ListingGrid>
      )}
      {q.isFetching && (
        <ListingGrid>
          {Array.from({ length: 4 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </ListingGrid>
      )}
      {hasMore && !q.isFetching && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => void (q.data ? q.fetchNextPage() : q.refetch())}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
