import { cn } from "~/lib/utils";

/**
 * ── Skeletons ──────────────────────────────────────────────────────────────
 *
 * Placeholders shaped like the thing that's coming, not spinners.
 *
 * Two reasons it's worth the extra markup. A skeleton occupies the exact space
 * the real content will, so a list doesn't jolt when data lands — and because
 * it's shaped like a card, it tells you *what* is loading rather than just
 * that something is. The sweep animation is what separates "arriving" from
 * "broken"; a static grey box reads as a failure.
 *
 * These mirror the real components closely enough that the two should be
 * edited together — if a card gains a row, its skeleton gains a bar.
 */

/** One shimmering block. Everything else here is composed from it. */
export function Skeleton({
  className,
  rounded = "rounded-ar",
}: {
  className?: string;
  rounded?: string;
}) {
  return <div className={cn("ar-skeleton", rounded, className)} aria-hidden />;
}

/**
 * A run of text bars. The last one is short, the way a wrapped paragraph
 * actually ends — equal-length bars read as a table, not prose.
 */
export function SkeletonText({
  lines = 2,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          rounded="rounded-full"
          className={cn("h-2.5", i === lines - 1 ? "w-2/5" : "w-full")}
        />
      ))}
    </div>
  );
}

/** Matches `BrandRow` on /brands — same 52px avatar and three text lines. */
export function BrandRowSkeleton() {
  return (
    <div className="ar-bevel relative flex items-center gap-3 overflow-hidden rounded-ar p-3">
      <Skeleton className="h-[52px] w-[52px] shrink-0" rounded="rounded-[14px]" />
      <div className="min-w-0 flex-1">
        <Skeleton rounded="rounded-full" className="h-3 w-1/2" />
        <Skeleton rounded="rounded-full" className="mt-2 h-2.5 w-4/5" />
        <Skeleton rounded="rounded-full" className="mt-2 h-2 w-1/3" />
      </div>
      <Skeleton className="h-8 w-[74px] shrink-0" rounded="rounded-full" />
    </div>
  );
}

/** Matches a `HoloCard` tile in the collection grid — portrait, 3:4. */
/**
 * Placeholder for a `HoloCard` in a grid.
 *
 * `aspect-[5/7]` rather than a rounder guess because that is exactly the card's
 * own ratio — a skeleton of a different shape makes the whole grid jump when
 * the real cards swap in, which reads as a glitch rather than as loading.
 */
export function CardSkeleton() {
  return <Skeleton className="aspect-[5/7] w-full" rounded="rounded-[14px]" />;
}

/** Matches a card in the map's nearby rail — same 168px width and 34×46 art. */
export function NearbyCardSkeleton() {
  return (
    <div className="ar-glass flex w-[168px] shrink-0 items-center gap-2.5 rounded-ar p-2">
      <Skeleton className="h-[46px] w-[34px] shrink-0" rounded="rounded-[8px]" />
      <div className="min-w-0 flex-1">
        <Skeleton rounded="rounded-full" className="h-2.5 w-4/5" />
        <Skeleton rounded="rounded-full" className="mt-1.5 h-2 w-3/5" />
        <Skeleton rounded="rounded-full" className="mt-1.5 h-2 w-1/2" />
      </div>
    </div>
  );
}

/** A row of stat blocks, as on the collection header and brand page. */
export function StatRowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="ar-bevel flex items-center rounded-ar">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 px-3 py-2.5",
            i > 0 && "border-l border-ar-line",
          )}
        >
          <Skeleton rounded="rounded-full" className="mx-auto h-4 w-10" />
          <Skeleton rounded="rounded-full" className="mx-auto mt-1.5 h-2 w-12" />
        </div>
      ))}
    </div>
  );
}
