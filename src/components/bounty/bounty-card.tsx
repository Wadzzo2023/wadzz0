"use client";

import { CheckCircle2, FileText, Lock, Settings2, Share2, Target, Trophy, Upload, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePriceText } from "~/components/price/price";
import toast from "react-hot-toast";

import { env } from "~/env";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { type BountyCardData, formatTokens } from "~/lib/bounty";
import { cn } from "~/lib/utils";
import { Avatar } from "~/ui/person";
import { Skeleton } from "~/ui/skeleton";
import { api } from "~/utils/api";

/**
 * A bounty card: the cover fills the card behind a dark scrim, and on top sit
 * the reward line and spots left, the title and a short teaser, then the brand
 * with Join / Share. The whole card links to the bounty; the actions sit above
 * that link.
 */
export function BountyCard({ bounty, className }: { bounty: BountyCardData; className?: string }) {
  const href = `/bounties/${bounty.id}`;
  const priceText = usePriceText();

  return (
    <article
      className={cn(
        "group relative isolate flex min-h-60 flex-col overflow-hidden rounded-2xl bg-surface-2 p-5 text-white ring-1 ring-foreground/10 transition-all duration-300 hover:glow hover:-translate-y-1",
        className,
      )}
    >
      {/* background */}
      {bounty.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bounty.imageUrl} alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-700 group-hover:scale-110" />
      ) : (
        <div className="absolute inset-0 -z-10 flex items-center justify-center bg-black bg-[radial-gradient(circle_at_25%_20%,hsl(var(--primary)/0.55),transparent_60%),radial-gradient(circle_at_80%_75%,hsl(190_90%_45%/0.45),transparent_60%)]">
          <Target className="size-20 text-white/20" />
        </div>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/75 via-black/60 to-black/85" />

      {/* reward + spots */}
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-1.5 text-sm">
          <CheckCircle2 className="size-5 shrink-0 text-[hsl(112_85%_62%)]" />
          <span className="font-hud text-lg font-bold tabular-nums text-[hsl(112_85%_62%)] drop-shadow-[0_0_12px_hsl(112_85%_55%/0.5)]">
            {priceText(bounty.rewardAsset, bounty.rewardUsd, bounty.assetCode)}
          </span>
          <span className="truncate text-white/65">
            / {bounty.totalWinners} winner{bounty.totalWinners === 1 ? "" : "s"}
          </span>
        </p>
        <span className={cn("shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold ring-1 ring-white/20 backdrop-blur-md", !bounty.open && "text-white/60")}>
          {bounty.open ? `${bounty.spotsLeft} left` : "Closed"}
        </span>
      </div>

      {/* title + teaser — the title's link stretches over the whole card */}
      <div className="mt-4 flex-1 space-y-2">
        <h3 className="line-clamp-2 font-hud text-lg font-bold leading-snug">
          <Link href={href} className="after:absolute after:inset-0 after:-z-0 focus-visible:outline-none">
            {bounty.title}
          </Link>
        </h3>
        {bounty.summary && <p className="line-clamp-3 text-sm leading-relaxed text-white/70">{bounty.summary}</p>}
      </div>

      {/* brand + actions */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-sm text-white/75">
          <Avatar src={bounty.brand.avatarUrl} name={bounty.brand.name} className="size-7 border border-white/30 text-[10px]" />
          <span className="truncate">By {bounty.brand.name}</span>
        </span>
        <div className="relative z-10 flex shrink-0 items-center gap-1 text-sm font-semibold">
          <JoinAction bounty={bounty} href={href} />
          <span className="h-4 w-px bg-white/25" aria-hidden />
          <ShareAction title={bounty.title} href={href} />
        </div>
      </div>
    </article>
  );
}

/**
 * The card's main action, following the same rules as the detail page:
 * owner → manage in the portal; winner → trophy; joined → submit (or view
 * entries once closed); open → join, unless the viewer holds less than the
 * required balance; closed → nothing to do.
 */
function JoinAction({ bounty, href }: { bounty: BountyCardData; href: string }) {
  const { signedIn, requireAuth } = useRequireAuth();
  const utils = api.useUtils();
  const join = api.bounty.join.useMutation({
    onSuccess: () => {
      toast.success("You joined — now submit your entry");
      void utils.bounty.list.invalidate();
      void utils.bounty.mine.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const joined = bounty.viewer.joined || join.isSuccess;
  const needsBalance = bounty.open && !joined && !bounty.isOwner && bounty.requiredBalance > 0;
  const balance = api.user.platformBalance.useQuery(undefined, { enabled: signedIn && needsBalance });
  const short = needsBalance && balance.data != null && balance.data.balance < bounty.requiredBalance;

  const action = "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-white/10";
  const green = "text-[hsl(112_85%_62%)]";

  if (bounty.isOwner) {
    const portal = env.NEXT_PUBLIC_BRAND_PORTAL_URL.replace(/\/$/, "");
    return (
      <a href={`${portal}/bounties/${bounty.id}`} target="_blank" rel="noreferrer" className={cn(action, green)}>
        <Settings2 className="size-4" /> Manage
      </a>
    );
  }
  if (bounty.viewer.won) {
    return (
      <Link href={href} className={cn(action, "text-amber-300")}>
        <Trophy className="size-4" /> You won
      </Link>
    );
  }
  if (joined) {
    return bounty.open ? (
      <Link href={`${href}?section=entries`} className={cn(action, green)}>
        <Upload className="size-4" /> {bounty.viewer.entryCount ? "Submit another" : "Submit entry"}
      </Link>
    ) : bounty.viewer.entryCount ? (
      <Link href={`${href}?section=entries`} className={cn(action, "text-white/80")}>
        <FileText className="size-4" /> My entries
      </Link>
    ) : null;
  }
  if (!bounty.open) return <span className="px-2 py-1 text-white/50">Closed</span>;
  if (short) {
    return (
      <Link href="/wallet" title={`Hold at least ${bounty.requiredBalance.toLocaleString("en-US")} ${bounty.assetCode} to join`} className={cn(action, "text-amber-300")}>
        <Lock className="size-4" /> Need {formatTokens(bounty.requiredBalance)} {bounty.assetCode}
      </Link>
    );
  }
  return (
    <button
      type="button"
      disabled={join.isPending || (needsBalance && balance.isLoading)}
      onClick={requireAuth(() => join.mutate({ id: bounty.id }))}
      className={cn(action, green, "disabled:opacity-60")}
    >
      <UserPlus className="size-4" /> {join.isPending ? "Joining…" : "Join"}
    </button>
  );
}

function ShareAction({ title, href }: { title: string; href: string }) {
  const share = async () => {
    const url = new URL(href, window.location.origin).toString();
    if (navigator.share) await navigator.share({ title, url }).catch(() => undefined);
    else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };
  return (
    <button type="button" onClick={() => void share()} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white">
      <Share2 className="size-4" /> Share
    </button>
  );
}

export function BountyCardSkeleton() {
  return <Skeleton className="min-h-60 rounded-2xl" />;
}
