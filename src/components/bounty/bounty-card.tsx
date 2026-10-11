import { Clock, Target, Trophy, Users } from "lucide-react";
import Link from "next/link";

import { formatAmount } from "~/lib/stellar/quote";
import { cn } from "~/lib/utils";
import { Avatar } from "~/ui/person";
import { StatusPill } from "~/ui/status-pill";
import type { RouterOutputs } from "~/utils/api";

export type BountyCardData = RouterOutputs["bounty"]["list"]["items"][number];

function timeLeft(end: Date | null) {
  if (!end) return "No deadline";
  const ms = new Date(end).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const d = Math.floor(ms / 86_400_000);
  return d >= 1 ? `${d}d left` : `${Math.max(1, Math.floor(ms / 3_600_000))}h left`;
}

/** A bounty in a list: brand, task, reward per winner, deadline and the viewer's status. */
export function BountyCard({ bounty, className }: { bounty: BountyCardData; className?: string }) {
  return (
    <Link href={`/bounties/${bounty.id}`} className={cn("glass group flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:glow hover:-translate-y-1", className)}>
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
        {bounty.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bounty.imageUrl} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex size-full items-center justify-center bg-[radial-gradient(circle,hsl(var(--primary)/0.25),transparent_70%)] text-primary/70">
            <Target className="size-10" />
          </div>
        )}
        <span className="absolute left-2 top-2">
          {bounty.viewer.won ? (
            <StatusPill tone="success" icon={Trophy}>You won</StatusPill>
          ) : bounty.viewer.joined ? (
            <StatusPill tone="primary">Joined</StatusPill>
          ) : null}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <Avatar src={bounty.brand.avatarUrl} name={bounty.brand.name} className="size-6 text-[10px]" />
          <span className="truncate text-xs text-muted-foreground">{bounty.brand.name}</span>
        </div>
        <p className="line-clamp-2 font-hud text-sm font-semibold">{bounty.title}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-hud text-sm font-bold text-gradient">{formatAmount(bounty.rewardAsset, bounty.assetCode)}</span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" /> {bounty.participants}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" /> {timeLeft(bounty.endDate)}
          </span>
        </div>
      </div>
    </Link>
  );
}
