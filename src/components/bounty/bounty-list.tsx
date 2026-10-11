"use client";

import { Target } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/shadcn/ui/button";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { cn } from "~/lib/utils";
import { EmptyState } from "~/ui/empty-state";
import { Skeleton } from "~/ui/skeleton";
import { SearchInput } from "~/ui/toolbar";
import { api } from "~/utils/api";

import { BountyCard, type BountyCardData } from "./bounty-card";

const TABS = [
  { id: "open", label: "Open" },
  { id: "ending", label: "Ending soon" },
  { id: "top", label: "Top rewards" },
  { id: "joined", label: "Joined" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const Grid = ({ items }: { items: BountyCardData[] }) => (
  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
    {items.map((b) => (
      <BountyCard key={b.id} bounty={b} />
    ))}
  </div>
);

/** Bounty browser: open / ending soon / top rewards, plus the ones I joined. */
export function BountyList({ initial }: { initial: BountyCardData[] }) {
  const { signedIn, openSignIn } = useRequireAuth();
  const [tab, setTab] = useState<Tab>("open");
  const [search, setSearch] = useState("");
  const listTab = tab === "joined" ? "open" : tab;
  const list = api.bounty.list.useInfiniteQuery(
    { filter: listTab, search: search || undefined, limit: 20 },
    { getNextPageParam: (p) => p.nextCursor, enabled: tab !== "joined", initialData: tab === "open" && !search ? { pages: [{ items: initial, nextCursor: null }], pageParams: [null] } : undefined },
  );
  const mine = api.bounty.mine.useQuery(undefined, { enabled: tab === "joined" && signedIn });
  const items = tab === "joined" ? (mine.data ?? []) : (list.data?.pages.flatMap((p) => p.items) ?? []);
  const loading = tab === "joined" ? mine.isLoading : list.isLoading;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="glass flex gap-1 overflow-x-auto rounded-xl p-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => (t.id === "joined" && !signedIn ? openSignIn() : setTab(t.id))}
              className={cn("h-9 shrink-0 rounded-lg px-4 text-sm font-semibold transition-colors", tab === t.id ? "bg-primary text-primary-foreground shadow-[0_0_20px_-6px_hsl(var(--primary)/0.8)]" : "text-muted-foreground hover:text-foreground")}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab !== "joined" && <SearchInput value={search} onSearch={setSearch} placeholder="Search bounties or brands" />}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Target} title={tab === "joined" ? "You haven't joined any bounties" : "No bounties right now"} description="New tasks from brands appear here." />
      ) : (
        <Grid items={items} />
      )}
      {tab !== "joined" && list.hasNextPage && (
        <div className="flex justify-center">
          <Button variant="outline" disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
            {list.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
