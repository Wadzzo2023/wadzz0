"use client";

import { Diamond } from "lucide-react";
import Link from "next/link";

import { formatTokenNumber } from "~/lib/money";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { api } from "~/utils/api";

/**
 * The strip across the top of every page, like an exchange ticker: what's on
 * the market right now. One transform animation (pauses on hover); nothing else moves.
 */
export function MarketTicker() {
  const listings = api.market.listings.useQuery({ kind: "all", limit: 14 }, { staleTime: 5 * 60_000 });
  const items = listings.data?.items ?? [];
  const row = [...items, ...items];
  return (
    <div className="relative flex h-11 items-center overflow-hidden bg-side-ink text-side-mint">
      <span className="flex h-full shrink-0 items-center gap-2 pl-4 pr-3 text-sm font-bold">
        <Diamond className="size-3.5 fill-side text-side" /> On the market
      </span>
      <div className="group flex min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_3%,black_97%,transparent)]">
        {items.length > 2 && (
          <div className="flex shrink-0 animate-marquee items-center gap-7 pl-4 group-hover:[animation-play-state:paused]">
            {row.map((l, idx) => (
              <Link key={`${l.id}-${idx}`} href={`/item/${l.asset.id}`} tabIndex={idx >= items.length ? -1 : undefined} className="flex shrink-0 items-center gap-2 text-sm text-side-mint/70 transition-colors hover:text-side-mint">
                <span className="display text-base text-side-mint">{l.asset.creator?.name ?? "Wadzzo"}</span>
                <span className="max-w-[14rem] truncate">{l.asset.name}</span>
                <span className="font-semibold tabular-nums text-side">
                  {formatTokenNumber(l.price)} {PLATFORM_ASSET.code}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
