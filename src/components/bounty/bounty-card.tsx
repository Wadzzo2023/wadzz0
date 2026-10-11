import { Clock, Target, Trophy, Users } from "lucide-react";
import Link from "next/link";

import { type BountyCardData, deadlineLabel, formatTokens, formatUsd, spotsFilled, viewerBadge } from "~/lib/bounty";
import { cn } from "~/lib/utils";
import { Avatar } from "~/ui/person";
import { Skeleton } from "~/ui/skeleton";
import { StatusPill } from "~/ui/status-pill";

/**
 * A bounty as a poster: the cover fills the whole card and everything sits on
 * top of it — status and deadline up top; brand, task, reward and winner
 * spots on a frosted panel at the bottom.
 */
export function BountyCard({ bounty, className }: { bounty: BountyCardData; className?: string }) {
  const badge = viewerBadge(bounty);
  const deadline = deadlineLabel(bounty.endDate);
  const filled = spotsFilled(bounty);

  return (
    <Link
      href={`/bounties/${bounty.id}`}
      className={cn(
        "group relative isolate flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-2xl bg-surface-2 p-2 text-white ring-1 ring-foreground/10 transition-all duration-300 hover:glow hover:-translate-y-1",
        className,
      )}
    >
      {/* background */}
      {bounty.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bounty.imageUrl} alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-700 group-hover:scale-110" />
      ) : (
        <div className="absolute inset-0 -z-10 flex items-center justify-center bg-[radial-gradient(circle_at_25%_20%,hsl(var(--primary)/0.55),transparent_60%),radial-gradient(circle_at_80%_75%,hsl(190_90%_45%/0.45),transparent_60%)] bg-black">
          <Target className="size-20 text-white/25" />
        </div>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/5 to-black/85" />

      {/* top */}
      <div className="flex items-start justify-between gap-2">
        <StatusPill tone={badge.tone} className="text-[10px] !text-white bg-black/45 shadow-sm ring-1 ring-white/15 backdrop-blur-md">
          {badge.label}
        </StatusPill>
        {deadline && (
          <span className={cn("inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold ring-1 ring-white/15 backdrop-blur-md", deadline.urgent && "text-amber-300")}>
            <Clock className="size-3" /> {deadline.text}
          </span>
        )}
      </div>

      {/* bottom panel */}
      <div className="space-y-2 rounded-xl bg-black/40 p-2.5 ring-1 ring-white/15 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Avatar src={bounty.brand.avatarUrl} name={bounty.brand.name} className="size-5 border border-white/40 text-[8px]" />
          <span className="truncate text-[11px] font-semibold text-white/85">{bounty.brand.name}</span>
        </div>
        <p className="line-clamp-2 font-hud text-sm font-bold leading-snug">{bounty.title}</p>

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
                        <p className="font-hud text-lg font-bold leading-tight text-[hsl(112_85%_62%)] drop-shadow-[0_0_14px_hsl(112_85%_55%/0.55)]">{formatUsd(bounty.rewardUsd)}</p>
            <p className="truncate text-[11px] tabular-nums text-white/60">
              {formatTokens(bounty.rewardAsset)} {bounty.assetCode}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold">
            <Users className="size-3" /> {bounty.participants}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-white/70">
            <span className="inline-flex items-center gap-1">
              <Trophy className="size-3" /> {bounty.open ? `${bounty.spotsLeft}/${bounty.totalWinners} spots left` : `${bounty.totalWinners} winner${bounty.totalWinners === 1 ? "" : "s"}`}
            </span>
            <span className="tabular-nums">{filled}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400" style={{ width: `${Math.max(filled, 3)}%` }} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function BountyCardSkeleton() {
  return <Skeleton className="aspect-[3/4] rounded-2xl" />;
}
