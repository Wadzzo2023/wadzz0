"use client";

import { MessageCircle, Search, Trophy, Wallet, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { BountyCard, BountyCardSkeleton } from "~/components/bounty/BountyCard";
import { AppShell, ScreenHeader } from "~/components/ar/AppShell";
import { ArButton } from "~/components/ar/ArButton";
import { Chip } from "~/components/ar/Badges";
import { SegmentedTabs } from "~/components/ar/SegmentedTabs";
import { useAuth } from "~/hooks/use-ar-auth";
import { useBountyAttention } from "~/hooks/use-bounty-attention";
import { keepPreviousData } from "@tanstack/react-query";

import { api } from "~/utils/api";

type Segment = "explore" | "mine";
type Filter = "open" | "ending" | "top";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "open", label: "Newest" },
  { id: "ending", label: "Ending soon" },
  { id: "top", label: "Top reward" },
];

const PAGE_SIZE = 12;

/**
 * ── /bounty ────────────────────────────────────────────────────────────────
 *
 * Tasks brands are paying for. Two questions, two segments: "what can I
 * take on?" (Explore) and "how are the ones I took on going?" (Mine).
 *
 * Above both sits "Needs you" — only when something does: a win you haven't
 * opened, or a brand that answered you. It's the reason to come back to this
 * tab, so it goes first rather than being buried in a list.
 *
 * Browsable signed out, like everything else; joining is what asks for a
 * wallet.
 */
export default function BountyScreen() {
  const user = useAuth((s) => s.user);
  const requireAuth = useAuth((s) => s.requireAuth);

  const [segment, setSegment] = useState<Segment>("explore");
  const [filter, setFilter] = useState<Filter>("open");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  // Debounced so each keystroke isn't its own round trip.
  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const explore = api.bounty.list.useInfiniteQuery(
    { filter, search: search || undefined, limit: PAGE_SIZE },
    {
      getNextPageParam: (last) => last.nextCursor ?? undefined,
      enabled: segment === "explore",
      placeholderData: keepPreviousData,
    },
  );
  const mine = api.bounty.mine.useQuery(undefined, { enabled: Boolean(user) });
  const { unseen } = useBountyAttention();

  const exploreItems = explore.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <AppShell wide>
      <div className="flex h-full flex-col">
        <ScreenHeader eyebrow="Earn from brands" title="Bounty" />

        <div className="ar-scroll flex-1 pb-6">
          {/* ── Needs you ──────────────────────────────────────────── */}
          {unseen.length > 0 && (
            <section className="px-5 pb-4">
              <h2 className="font-hud mb-2 text-[9.5px] font-semibold uppercase tracking-[0.24em] text-ar-green">
                Needs you
              </h2>
              <div className="space-y-2">
                {unseen.map((item) => (
                  <Link
                    key={`${item.kind}-${item.bountyId}`}
                    href={`/bounties/${item.bountyId}${item.kind === "reply" ? "?section=chat" : ""}`}
                    className="ar-glass flex items-center gap-3 rounded-ar p-3"
                  >
                    <span
                      className={
                        item.kind === "won"
                          ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-rarity-legendary/50 bg-rarity-legendary/15 text-rarity-legendary"
                          : "flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-ar-green/40 bg-ar-green/10 text-ar-green-hot"
                      }
                    >
                      {item.kind === "won" ? (
                        <Trophy size={16} strokeWidth={2.3} />
                      ) : (
                        <MessageCircle size={16} strokeWidth={2.3} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-ar-text">
                        {item.kind === "won"
                          ? "You won a bounty"
                          : "The brand replied"}
                      </span>
                      <span className="block truncate text-[11.5px] text-ar-faint">
                        {item.title}
                      </span>
                    </span>
                    <span className="h-2 w-2 shrink-0 rounded-full bg-ar-green-hot shadow-[0_0_8px_hsl(var(--ar-green)/0.9)]" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          <SegmentedTabs
            layoutId="bounty-segments"
            value={segment}
            onChange={setSegment}
            className="mx-5"
            tabs={[
              { id: "explore", label: "Explore" },
              {
                id: "mine",
                label: "Joined",
                count: user ? mine.data?.length : undefined,
              },
            ]}
          />

          {segment === "explore" ? (
            <>
              {/* ── Search + sort ──────────────────────────────────── */}
              <div className="mx-5 mt-3">
                <div className="ar-bevel flex h-11 items-center gap-2.5 rounded-ar px-3.5">
                  <Search
                    size={15}
                    strokeWidth={2.2}
                    className="shrink-0 text-ar-faint"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search bounties or brands"
                    aria-label="Search bounties"
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-ar-text outline-none placeholder:text-ar-faint"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                      className="shrink-0 text-ar-faint hover:text-ar-text"
                    >
                      <X size={15} strokeWidth={2.4} />
                    </button>
                  )}
                </div>
              </div>

              <div className="ar-scroll-x mt-3 flex gap-1.5 px-5">
                {FILTERS.map((f) => (
                  <Chip
                    key={f.id}
                    active={filter === f.id}
                    onClick={() => setFilter(f.id)}
                  >
                    {f.label}
                  </Chip>
                ))}
              </div>

              <div className="mt-3.5 grid gap-3 px-5 sm:grid-cols-2 lg:grid-cols-3">
                {explore.isLoading &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <BountyCardSkeleton key={i} />
                  ))}

                {exploreItems.map((b) => (
                  <BountyCard key={b.id} bounty={b} />
                ))}

                {explore.isError && (
                  <ErrorNote onRetry={() => void explore.refetch()} />
                )}

                {!explore.isLoading &&
                  !explore.isError &&
                  exploreItems.length === 0 && (
                    <Empty
                      title={search ? "No matches" : "No open bounties"}
                      body={
                        search
                          ? "Nothing open matches that search."
                          : "Brands post bounties here — check back soon."
                      }
                    />
                  )}

                {explore.hasNextPage && (
                  <div className="flex justify-center pt-2">
                    <ArButton
                      variant="outline"
                      busy={explore.isFetchingNextPage}
                      onClick={() => void explore.fetchNextPage()}
                    >
                      Show more
                    </ArButton>
                  </div>
                )}
              </div>
            </>
          ) : !user ? (
            <div className="px-7 py-14 text-center">
              <p className="font-hud text-[13px] font-bold uppercase tracking-[0.14em] text-ar-dim">
                Your bounties live here
              </p>
              <p className="mx-auto mt-1.5 max-w-[17rem] text-[12.5px] leading-relaxed text-ar-faint">
                Sign in to join bounties, send entries and track how they&rsquo;re
                doing.
              </p>
              <ArButton
                variant="primary"
                icon={Wallet}
                className="mt-5"
                onClick={() => requireAuth("bounty")}
              >
                Connect wallet
              </ArButton>
            </div>
          ) : (
            <div className="mt-3.5 grid gap-3 px-5 sm:grid-cols-2 lg:grid-cols-3">
              {mine.isLoading &&
                Array.from({ length: 2 }).map((_, i) => (
                  <BountyCardSkeleton key={i} />
                ))}
              {mine.data?.map((b) => <BountyCard key={b.id} bounty={b} />)}
              {mine.isError && <ErrorNote onRetry={() => void mine.refetch()} />}
              {mine.data?.length === 0 && (
                <Empty
                  title="Nothing joined yet"
                  body="Join a bounty from Explore and it'll show up here with your entries and results."
                  action={
                    <ArButton
                      variant="primary"
                      className="mt-5"
                      onClick={() => setSegment("explore")}
                    >
                      Explore bounties
                    </ArButton>
                  }
                />
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-14 text-center">
      <p className="font-hud text-[13px] font-bold uppercase tracking-[0.14em] text-ar-dim">
        {title}
      </p>
      <p className="mx-auto mt-1.5 max-w-[17rem] text-[12.5px] leading-relaxed text-ar-faint">
        {body}
      </p>
      {action}
    </div>
  );
}

function ErrorNote({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-ar border border-ar-danger/40 bg-ar-danger/10 px-3.5 py-2.5">
      <p className="text-[12px] text-ar-danger">Couldn&rsquo;t load bounties.</p>
      <button
        onClick={onRetry}
        className="font-hud text-[11px] font-semibold uppercase tracking-[0.1em] text-ar-text"
      >
        Retry
      </button>
    </div>
  );
}
