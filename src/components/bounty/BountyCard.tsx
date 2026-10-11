import { Clock, Trophy, Users } from "lucide-react";
import Link from "next/link";

import { BrandAvatar } from "~/components/ar/BrandAvatar";
import { Skeleton } from "~/components/ar/Skeleton";
import {
  type BountyCard as BountyCardData,
  deadlineLabel,
  formatAmount,
  formatUsd,
  TONE_CLASS,
  viewerBadge,
} from "~/lib/bounty";
import { cn } from "~/lib/utils";

/**
 * ── BountyCard ─────────────────────────────────────────────────────────────
 *
 * A bounty in a list. Reads top to bottom in the order a fan decides: who's
 * asking, what it pays, how much room is left, how long you've got — and,
 * in the corner, where you already stand on it.
 */
export function BountyCard({ bounty }: { bounty: BountyCardData }) {
  const badge = viewerBadge(bounty);
  const deadline = deadlineLabel(bounty.endDate);

  return (
    <Link
      href={`/bounties/${bounty.id}`}
      className="ar-bevel group relative block overflow-hidden rounded-ar-lg"
    >
      <div className="relative h-[112px] overflow-hidden">
        {bounty.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bounty.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="ar-grid h-full w-full bg-gradient-to-br from-ar-green/20 via-ar-surface to-ar-surface" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ar-surface via-ar-surface/30 to-transparent" />

        <span
          className={cn(
            "font-hud absolute right-2.5 top-2.5 inline-flex h-[22px] items-center rounded-full border px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] backdrop-blur-sm",
            TONE_CLASS[badge.tone],
          )}
        >
          {badge.label}
        </span>
      </div>

      <div className="relative -mt-7 px-3.5 pb-3.5">
        <div className="flex items-end gap-2">
          <BrandAvatar
            src={bounty.brand.avatarUrl}
            className="h-9 w-9 rounded-[11px] ring-2 ring-ar-surface"
          />
          <span className="font-hud mb-0.5 truncate text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ar-dim">
            {bounty.brand.name}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 text-[15px] font-semibold leading-snug text-ar-text">
          {bounty.title}
        </p>

        <div className="mt-2.5 flex items-end justify-between gap-3">
          <div>
            <p className="font-hud text-glow-soft text-[20px] font-bold leading-none tabular-nums text-ar-green-hot">
              {formatUsd(bounty.rewardUsd)}
            </p>
            <p className="font-hud mt-1 text-[10px] font-semibold tabular-nums text-ar-faint">
              {formatAmount(bounty.rewardAsset)} {bounty.assetCode} per winner
            </p>
          </div>

          <div className="font-hud flex flex-col items-end gap-1 text-[10px] font-semibold tabular-nums text-ar-dim">
            <span className="flex items-center gap-1">
              <Trophy size={10} strokeWidth={2.6} />
              {bounty.open
                ? `${bounty.spotsLeft} of ${bounty.totalWinners} spots left`
                : `${bounty.totalWinners} winner${bounty.totalWinners === 1 ? "" : "s"}`}
            </span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Users size={10} strokeWidth={2.6} />
                {bounty.participants}
              </span>
              {deadline && (
                <span
                  className={cn(
                    "flex items-center gap-1",
                    deadline.urgent && "text-rarity-legendary",
                  )}
                >
                  <Clock size={10} strokeWidth={2.6} />
                  {deadline.text}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Same footprint as `BountyCard`, so the list doesn't jump when data lands. */
export function BountyCardSkeleton() {
  return (
    <div className="ar-bevel overflow-hidden rounded-ar-lg">
      <Skeleton className="h-[112px] w-full" rounded="rounded-none" />
      <div className="px-3.5 pb-3.5 pt-2">
        <Skeleton rounded="rounded-full" className="h-2.5 w-1/3" />
        <Skeleton rounded="rounded-full" className="mt-3 h-3.5 w-4/5" />
        <div className="mt-3 flex items-end justify-between">
          <Skeleton rounded="rounded-full" className="h-5 w-20" />
          <Skeleton rounded="rounded-full" className="h-2.5 w-24" />
        </div>
      </div>
    </div>
  );
}
