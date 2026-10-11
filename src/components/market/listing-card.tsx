import { BadgeCheck, Lock, Repeat2 } from "lucide-react";
import Link from "next/link";
import { Price } from "~/components/price/price";

import { MEDIA_META } from "~/components/media/media-meta";
import { cn } from "~/lib/utils";
import type { ListingCard as ListingCardData } from "~/server/api/routers/market";
import { Avatar } from "~/ui/person";
import { Skeleton } from "~/ui/skeleton";

const num = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/**
 * A listing as an NFT-marketplace card: inset artwork that zooms on hover,
 * glass badges for kind / resale / access, the creator, and a price panel.
 * "Buy now" slides up over the art on hover.
 */
export function ListingCard({ listing, className }: { listing: ListingCardData; className?: string }) {
  const a = listing.asset;
  const meta = MEDIA_META[a.mediaType];
  const resale = listing.placerId !== a.creatorId;
  const locked = !resale && (listing.privacy === "PRIVATE" || listing.privacy === "TIER");
  const glass = "flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-semibold text-white ring-1 ring-white/15 backdrop-blur-md";

  return (
    <Link
      href={`/item/${a.id}`}
      className={cn(
        "glass group flex flex-col rounded-2xl p-2 transition-all duration-300",
        "hover:glow hover:-translate-y-1",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.thumbnail} alt={a.name} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-1">
          <span className={glass}>
            <meta.icon className="size-3" /> {meta.label}
          </span>
          {resale ? (
            <span className={glass}>
              <Repeat2 className="size-3" /> Resale
            </span>
          ) : locked ? (
            <span className={glass} title={listing.privacy === "TIER" ? `${a.tier?.name ?? "Tier"} members` : "Followers only"}>
              <Lock className="size-3" /> {listing.privacy === "TIER" ? (a.tier?.name ?? "Members") : "Followers"}
            </span>
          ) : null}
        </div>
        <span className="absolute inset-x-2 bottom-2 flex h-9 translate-y-[140%] items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-[0_0_24px_-4px_hsl(var(--primary)/0.8)] transition-transform duration-300 group-hover:translate-y-0">
          Buy now
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-1.5 pb-1 pt-2.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Avatar src={a.creator?.profileUrl} name={a.creator?.name} className="size-5 text-[9px]" />
          <span className="truncate">{a.creator?.name ?? "Wadzzo"}</span>
          {a.creator && <BadgeCheck className="size-3.5 shrink-0 text-primary" aria-label="Creator" />}
        </div>
        <p className="truncate font-hud text-[15px] font-semibold leading-tight">{a.name}</p>
        <div className="mt-auto flex items-end justify-between gap-2 rounded-xl bg-foreground/[0.04] px-2.5 py-2 ring-1 ring-foreground/[0.06]">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Price</p>
            <Price tokens={listing.price} usd={listing.priceUSD} size="sm" />
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{resale ? "Seller" : "Edition"}</p>
            <p className="max-w-[6.5rem] truncate text-xs font-semibold">{resale ? (listing.placer?.name ?? "Fan") : a.limit == null ? "Open" : num.format(a.limit)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-2">
      <Skeleton className="aspect-square rounded-xl" />
      <div className="space-y-2 px-1.5 pb-1 pt-2.5">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-11 rounded-xl" />
      </div>
    </div>
  );
}

/** Responsive grid: 2 columns on phones up to 6 on very wide screens. */
export function ListingGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6", className)}>{children}</div>;
}
