import { ArrowUpRight, BadgeCheck, Lock, Repeat2 } from "lucide-react";
import Link from "next/link";

import { MEDIA_META } from "~/components/media/media-meta";
import { formatTokenNumber, formatUsdAmount } from "~/lib/money";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { cn } from "~/lib/utils";
import type { ListingCard as ListingCardData } from "~/server/api/routers/market";
import { Avatar } from "~/ui/person";
import { Skeleton } from "~/ui/skeleton";
import { artChip as chip } from "~/ui/styles";

const num = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/**
 * A listing as a poster: the art fills the card, the kind / resale / access
 * chips sit top-left, the price is a tilted green sticker top-right, and the
 * creator, name and mint bar sit on a dark fade at the bottom. On hover it
 * lifts, tilts and drops a hard green shadow (transforms only, no blur).
 */
export function ListingCard({ listing, className }: { listing: ListingCardData; className?: string }) {
  const a = listing.asset;
  const meta = MEDIA_META[a.mediaType];
  const resale = listing.placerId !== a.creatorId;
  const locked = !resale && (listing.privacy === "PRIVATE" || listing.privacy === "TIER");
  const pct = a.limit ? Math.min(100, Math.round((a.mintedCount / a.limit) * 100)) : null;
  const soldOut = !resale && pct === 100;

  return (
    <Link
      href={resale ? `/item/${a.id}?listing=${listing.id}` : `/item/${a.id}`}
      className={cn("group relative block aspect-[3/4] transition-transform duration-200 ease-out hover:-translate-y-1 hover:-rotate-1", className)}
    >
      {/* the card itself clips the art; stickers outside it (sold out) hang over the corner */}
      <div className="border-foreground/10 bg-surface-3 group-hover:border-foreground absolute inset-0 overflow-hidden rounded-[1.4rem] border-2 transition-[border-color,box-shadow] duration-200 group-hover:shadow-[6px_7px_0_0_hsl(var(--primary))]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.thumbnail} alt={a.name} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/50 to-transparent" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/55 to-transparent" />

        {/* chips + price sticker */}
        <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col items-start gap-1">
            <span className={chip}>
              <meta.icon className="size-3" /> {meta.label}
            </span>
            {resale ? (
              <span className="marker bg-pink text-side-ink flex -rotate-2 items-center gap-1 rounded-md px-2 py-0.5 text-[11px]">
                <Repeat2 className="size-3" /> resale!
              </span>
            ) : locked ? (
              <span className={cn(chip, "bg-side-ink text-side-mint")} title={listing.privacy === "TIER" ? `${a.tier?.name ?? "Tier"} members` : "Followers only"}>
                <Lock className="size-3" /> {listing.privacy === "TIER" ? (a.tier?.name ?? "Members") : "Followers"}
              </span>
            ) : null}
          </div>
          <span className={cn("blob bg-primary text-primary-foreground shrink-0 rotate-3 px-2 py-0.5 text-right transition-transform duration-200 group-hover:scale-105 group-hover:rotate-0")}>
            <span className="block leading-none">
              <span className="display text-xl tabular-nums">{formatTokenNumber(listing.price)}</span> <span className="marker text-[9px]">{PLATFORM_ASSET.code}</span>
            </span>
            {listing.priceUSD != null && <span className="block text-[9px] font-bold opacity-75">≈ {formatUsdAmount(listing.priceUSD)}</span>}
          </span>
        </div>

        {/* creator, name, edition */}
        <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-3 text-white transition-transform duration-200 group-hover:-translate-y-0.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
            <Avatar src={a.creator?.profileUrl} name={a.creator?.name} className="size-5 text-[9px]" />
            <span className="truncate">{a.creator?.name ?? "Wadzzo"}</span>
            {a.creator && <BadgeCheck className="text-primary size-3.5 shrink-0" aria-label="Creator" />}
          </p>
          <p className="display line-clamp-2 pr-9 text-[1.65rem] leading-[0.92] break-words">{a.name}</p>
          {resale ? (
            <p className="marker truncate text-xs text-white/75">sold by {listing.placer?.name ?? "a fan"}</p>
          ) : soldOut ? (
            <p className="marker truncate text-xs text-white/75">all {num.format(a.limit!)} minted</p>
          ) : pct != null ? (
            <div className="flex items-center gap-2" title={`${num.format(a.mintedCount)} of ${num.format(a.limit!)} minted`}>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                <div className="bg-primary h-full rounded-full" style={{ width: `${Math.max(pct, 3)}%` }} />
              </div>
              <span className="marker text-[11px] text-white/80 tabular-nums">{pct}% minted</span>
            </div>
          ) : (
            <p className="marker text-xs text-white/75">open edition · {num.format(a.mintedCount)} minted</p>
          )}
        </div>
        <span className="bg-primary text-primary-foreground absolute right-3 bottom-3 flex size-8 translate-y-2 items-center justify-center rounded-full opacity-0 transition-[transform,opacity] duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="size-4" strokeWidth={2.6} />
        </span>
      </div>

      {soldOut && (
        <span className="display border-side-ink bg-pink text-side-ink pointer-events-none absolute -top-3 -right-2 z-10 rotate-6 rounded-md border-[1.5px] px-1.5 text-xs leading-[1.15rem] whitespace-nowrap shadow-[2px_2px_0_0_hsl(var(--side-ink))] transition-transform duration-200 group-hover:rotate-3">
          Sold out
        </span>
      )}
    </Link>
  );
}

export function ListingCardSkeleton() {
  return <Skeleton className="aspect-[3/4] rounded-[1.4rem]" />;
}

/** Responsive grid: 2 columns on phones up to 6 on very wide screens. */
export function ListingGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6", className)}>{children}</div>;
}
