"use client";

import { FileText, Lock, Settings2, Share2, Target, Trophy, Upload, UserPlus } from "lucide-react";
import Link from "next/link";
import { priceText } from "~/components/price/price";
import toast from "react-hot-toast";

import { env } from "~/env";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { type BountyCardData, formatTokens } from "~/lib/bounty";
import { cn } from "~/lib/utils";
import { Avatar } from "~/ui/person";
import { Skeleton } from "~/ui/skeleton";
import { artChip } from "~/ui/styles";
import { api } from "~/utils/api";

/**
 * A bounty as a poster: the cover fills the card with the spots left on top,
 * and the reward (a tilted green sticker), brand, title, teaser and Join /
 * Share sit on a dark fade at the bottom. The whole card links to the bounty; the actions sit
 * above that link.
 */
export function BountyCard({ bounty, className }: { bounty: BountyCardData; className?: string }) {
  const href = `/bounties/${bounty.id}`;

  return (
    <article
      className={cn(
        "group border-foreground/10 bg-surface-3 relative isolate flex min-h-[19rem] flex-col overflow-hidden rounded-[1.4rem] border-2 p-3 text-white",
        "hover:border-foreground transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:-rotate-1 hover:shadow-[6px_7px_0_0_hsl(var(--primary))]",
        className,
      )}
    >
      {/* the cover is the card's background */}
      {bounty.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bounty.imageUrl} alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-500 group-hover:scale-105" />
      ) : (
        <div className="bg-pink/30 absolute inset-0 -z-10 flex items-center justify-center">
          <Target className="text-pink size-24" strokeWidth={1.6} />
        </div>
      )}
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-1/4 bg-gradient-to-b from-black/55 to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-[72%] bg-gradient-to-t from-black/90 via-black/65 to-transparent" />

      {/* reward + spots */}
      <div className="flex items-start justify-between gap-2">
        <Reward bounty={bounty} />
        <span className={cn(artChip, "shrink-0", !bounty.open && "text-white/70")}>{bounty.open ? `${bounty.spotsLeft} spots left` : "Closed"}</span>
      </div>

      {/* brand, title + teaser — the title's link stretches over the whole card */}
      <div className="mt-auto space-y-1.5 pt-6">
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-white/80">
          <Avatar src={bounty.brand.avatarUrl} name={bounty.brand.name} className="size-5 text-[9px]" />
          <span className="truncate">by {bounty.brand.name}</span>
        </span>
        <h3 className="display line-clamp-2 text-[1.9rem] leading-[0.95]">
          <Link href={href} className="after:absolute after:inset-0 after:-z-0 focus-visible:outline-none">
            {bounty.title}
          </Link>
        </h3>
        {bounty.summary && <p className="line-clamp-2 text-sm leading-relaxed text-white/75">{bounty.summary}</p>}

        {/* actions */}
        <div className="relative z-10 flex items-center gap-2 border-t-2 border-dashed border-white/20 pt-3 text-sm font-bold [&>:first-child]:flex-1 [&>:first-child]:justify-center">
          <JoinAction bounty={bounty} href={href} />
          <ShareAction title={bounty.title} href={href} />
        </div>
      </div>
    </article>
  );
}

/** The reward as a tilted green sticker: amount, then "/ N winners". */
function Reward({ bounty, className }: { bounty: BountyCardData; className?: string }) {
  return (
    <p className={cn("blob bg-primary text-primary-foreground flex -rotate-2 items-baseline gap-1.5 px-3 py-1 whitespace-nowrap", className)}>
      <span className="display text-2xl tabular-nums">{priceText(bounty.rewardAsset, bounty.assetCode)}</span>
      <span className="marker text-[11px]">
        / {bounty.totalWinners} winner{bounty.totalWinners === 1 ? "" : "s"}
      </span>
    </p>
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
  const balance = api.user.platformBalance.useQuery(undefined, {
    enabled: signedIn && needsBalance,
  });
  const short = needsBalance && balance.data != null && balance.data.balance < bounty.requiredBalance;

  const action = "inline-flex h-9 min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full px-3.5 transition-transform hover:-translate-y-0.5";
  const green = "bg-primary text-primary-foreground";

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
      <Link href={href} className={cn(action, "text-side-ink bg-[hsl(var(--rarity-legendary))]")}>
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
      <Link href={`${href}?section=entries`} className={cn(action, "border-2 border-white/30")}>
        <FileText className="size-4" /> My entries
      </Link>
    ) : null;
  }
  if (!bounty.open) return <span className="px-2 text-white/60">Closed</span>;
  if (short) {
    return (
      <Link href="/wallet" title={`Hold at least ${bounty.requiredBalance.toLocaleString("en-US")} ${bounty.assetCode} to join`} className={cn(action, "bg-pink text-side-ink")}>
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
    <button
      type="button"
      onClick={() => void share()}
      aria-label="Share"
      className="flex size-9 items-center justify-center rounded-full bg-white text-black transition-transform hover:-rotate-12"
    >
      <Share2 className="size-4" />
    </button>
  );
}

export function BountyCardSkeleton() {
  return <Skeleton className="min-h-[17rem] rounded-[1.4rem]" />;
}
