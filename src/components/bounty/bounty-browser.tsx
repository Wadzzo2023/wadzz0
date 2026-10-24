"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { ArrowRight, Bell, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "~/components/shadcn/ui/button";
import { useBountyAttention } from "~/hooks/use-bounty-attention";
import { useRequireAuth } from "~/hooks/use-require-auth";
import type { BountyCardData } from "~/lib/bounty";
import { cn } from "~/lib/utils";
import { wordTab, wordTabList, wordTabOff, wordTabOn } from "~/ui/styles";
import { EmptyState } from "~/ui/empty-state";
import { SearchInput } from "~/ui/toolbar";
import { api } from "~/utils/api";

import { BountyCard, BountyCardSkeleton } from "./bounty-card";

const TABS = [
  { id: "open", label: "Open" },
  { id: "top", label: "Top rewards" },
  { id: "joined", label: "Joined" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const grid = "grid grid-cols-1 gap-5 lg:grid-cols-2";

/** Bounty browser: filter tabs + search, a "needs you" strip, and the card grid. */
export function BountyBrowser({ initial }: { initial: BountyCardData[] }) {
  const { signedIn, openSignIn } = useRequireAuth();
  const [tab, setTab] = useState<Tab>("open");
  const [search, setSearch] = useState("");
  const isList = tab !== "joined";

  const list = api.bounty.list.useInfiniteQuery(
    { filter: isList ? tab : "open", search: search || undefined, limit: 18 },
    {
      getNextPageParam: (p) => p.nextCursor,
      enabled: isList,
      placeholderData: keepPreviousData,
      initialData: tab === "open" && !search ? { pages: [{ items: initial, nextCursor: initial.length >= 18 ? (initial.at(-1)?.id ?? null) : null }], pageParams: [null] } : undefined,
    },
  );
  const mine = api.bounty.mine.useQuery(undefined, { enabled: signedIn });
  const { unseen } = useBountyAttention();

  const items = isList ? (list.data?.pages.flatMap((p) => p.items) ?? []) : (mine.data ?? []);
  const loading = isList ? list.isLoading : mine.isLoading;

  return (
    <div className="space-y-6">
      {unseen.length > 0 && (
        <section className="blob space-y-3 bg-pink p-4 text-side-ink">
          <p className="marker flex -rotate-1 items-center gap-2 text-base">
            <Bell className="size-4" strokeWidth={2.6} /> needs you!
          </p>
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
            {unseen.map((u) => (
              <li key={`${u.kind}-${u.bountyId}`}>
                <Link
                  href={`/bounties/${u.bountyId}${u.kind === "won" ? "" : "?section=chat"}`}
                  className="flex items-center gap-3 rounded-xl bg-side-ink p-3 text-side-mint transition-transform hover:-translate-y-0.5"
                >
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", u.kind === "won" ? "tone-warning" : "tone-info")}>
                    {u.kind === "won" ? <Trophy className="size-4" /> : <Bell className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{u.kind === "won" ? "You won!" : "The brand replied"}</span>
                    <span className="block truncate text-xs text-side-mint/70">{u.title}</span>
                  </span>
                  <ArrowRight className="size-4" strokeWidth={2.6} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className={cn(wordTabList, "flex-1")} role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => (t.id === "joined" && !signedIn ? openSignIn() : setTab(t.id))}
              className={cn(wordTab, tab === t.id ? wordTabOn : wordTabOff)}
            >
              {t.label}
              {t.id === "joined" && signedIn && mine.data && (
                <span className={cn("rounded-full px-2 font-sans text-xs font-bold tabular-nums", tab === t.id ? "bg-primary text-primary-foreground" : "bg-foreground/10")}>{mine.data.length}</span>
              )}
            </button>
          ))}
        </div>
        {isList && <SearchInput value={search} onSearch={setSearch} placeholder="Search bounties or brands" />}
      </div>

      {loading ? (
        <div className={grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <BountyCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Target}
          title={tab === "joined" ? "You haven't joined a bounty yet" : search ? "No bounties match" : "No open bounties right now"}
          description={tab === "joined" ? "Join one to submit an entry and talk to the brand." : "New tasks from brands appear here."}
          action={tab === "joined" ? <Button onClick={() => setTab("open")}>Browse bounties</Button> : undefined}
        />
      ) : (
        <div className={grid}>
          {items.map((b) => (
            <BountyCard key={b.id} bounty={b} />
          ))}
        </div>
      )}

      {isList && list.hasNextPage && (
        <div className="flex justify-center">
          <Button variant="outline" disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
            {list.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
