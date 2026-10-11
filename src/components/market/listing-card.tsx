import { Lock, Repeat2 } from "lucide-react";
import Link from "next/link";

import { MEDIA_META } from "~/components/media/media-meta";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { formatAmount } from "~/lib/stellar/quote";
import { cn } from "~/lib/utils";
import type { ListingCard as ListingCardData } from "~/server/api/routers/market";
import { Skeleton } from "~/ui/skeleton";

/** A listing in a grid: thumbnail, kind, name, creator, price and a few honest badges. */
export function ListingCard({ listing, className }: { listing: ListingCardData; className?: string }) {
  const a = listing.asset;
  const meta = MEDIA_META[a.mediaType];
  const resale = listing.placerId !== a.creatorId;
  const locked = !resale && (listing.privacy === "PRIVATE" || listing.privacy === "TIER");
  const left = a.limit == null ? null : Math.max(0, a.limit - a.mintedCount);

  return (
    <Link
      href={`/item/${a.id}`}
      className={cn("group flex flex-col overflow-hidden rounded-xl border bg-card transition-[border-color,transform] hover:-translate-y-0.5 hover:border-line-bright", className)}
    >
      <div className="relative aspect-square overflow-hidden bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.thumbnail} alt={a.name} loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
          <meta.icon className="size-3" /> {meta.label}
        </span>
        <span className="absolute right-2 top-2 flex gap-1">
          {resale && (
            <span className="flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
              <Repeat2 className="size-3" /> Resale
            </span>
          )}
          {locked && (
            <span className="flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm" title={listing.privacy === "TIER" ? `${a.tier?.name ?? "Tier"} members` : "Followers only"}>
              <Lock className="size-3" /> {listing.privacy === "TIER" ? (a.tier?.name ?? "Tier") : "Followers"}
            </span>
          )}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="truncate font-hud text-sm font-semibold">{a.name}</p>
        <p className="truncate text-xs text-muted-foreground">{resale ? `by ${a.creator?.name ?? "creator"} · sold by ${listing.placer?.name ?? "fan"}` : (a.creator?.name ?? "Wadzzo")}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <span className="font-hud text-base font-bold tabular-nums">{formatAmount(listing.price, PLATFORM_ASSET.code)}</span>
          {!resale && left !== null && <span className="text-[11px] text-muted-foreground">{left > 0 ? `${left} left` : "Sold out"}</span>}
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

/** Responsive grid: 2 columns on phones up to 5 on wide screens. */
export function ListingGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-5", className)}>{children}</div>;
}
