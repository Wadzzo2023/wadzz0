"use client";

import { usePathname, useRouter } from "next/navigation";

import { Button } from "~/components/shadcn/ui/button";
import { SearchInput } from "~/ui/toolbar";
import { api } from "~/utils/api";

import { CreatorCard } from "./creator-card";

/** Search box that keeps the query in the URL (shareable, indexable). */
export function CreatorSearch({ value }: { value?: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/creators";
  return (
    <SearchInput
      value={value}
      placeholder="Search creators"
      onSearch={(q) => q !== (value ?? "") && router.push(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false })}
    />
  );
}

/** Pages after the first (the first renders on the server). */
export function LoadMoreCreators({ search, cursor }: { search?: string; cursor: string }) {
  const q = api.creator.list.useInfiniteQuery({ search, limit: 24 }, { initialCursor: cursor, getNextPageParam: (p) => p.nextCursor, enabled: false });
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  const hasMore = q.data ? q.hasNextPage : true;
  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((c) => (
            <CreatorCard key={c.id} creator={c} />
          ))}
        </div>
      )}
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" disabled={q.isFetching} onClick={() => void (q.data ? q.fetchNextPage() : q.refetch())}>
            {q.isFetching ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
