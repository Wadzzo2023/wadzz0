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
import { EmptyState } from "~/ui/empty-state";
import { SearchInput } from "~/ui/toolbar";
import { api } from "~/utils/api";

import { BountyCard, BountyCardSkeleton } from "./bounty-card";

const TABS = [
  { id: "open", label: "Open" },
  { id: "ending", label: "Ending soon" },
  { id: "top", label: "Top rewards" },
  { id: "joined", label: "Joined" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const grid = "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3";

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
        <section className="glass space-y-2 rounded-2xl border-primary/30 p-4">
          <p className="flex items-center gap-2 font-hud text-sm font-bold">
            <Bell className="size-4 text-primary" /> Needs you
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {unseen.map((u) => (
              <li key={`${u.kind}-${u.bountyId}`}>
                <Link
                  href={`/bounties/${u.bountyId}${u.kind === "won" ? "" : "?section=chat"}`}
                  className="flex items-center gap-3 rounded-xl bg-foreground/[0.04] p-3 ring-1 ring-foreground/[0.06] transition-colors hover:bg-primary/10"
                >
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", u.kind === "won" ? "tone-warning" : "tone-info")}>
                    {u.kind === "won" ? <Trophy className="size-4" /> : <Bell className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{u.kind === "won" ? "You won!" : "The brand replied"}</span>
                    <span className="block truncate text-xs text-muted-foreground">{u.title}</span>
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="glass flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl p-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => (t.id === "joined" && !signedIn ? openSignIn() : setTab(t.id))}
              className={cn(
                "flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors",
                tab === t.id ? "bg-primary text-primary-foreground shadow-[0_0_20px_-6px_hsl(var(--primary)/0.8)]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {t.id === "joined" && signedIn && mine.data && (
                <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", tab === t.id ? "bg-black/15" : "bg-foreground/10")}>{mine.data.length}</span>
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
          action={tab === "joined" ? <Button className="rounded-xl" onClick={() => setTab("open")}>Browse bounties</Button> : undefined}
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
          <Button variant="outline" className="rounded-xl" disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
            {list.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
