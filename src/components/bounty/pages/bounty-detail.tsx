"use client";

import { motion } from "motion/react";
import {
  ChevronLeft,
  Clock,
  Lock,
  Send,
  Share2,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BrandAvatar } from "~/components/ar/BrandAvatar";
import { ChatPanel } from "~/components/bounty/ChatPanel";
import { DiscussionPanel } from "~/components/bounty/DiscussionPanel";
import { EntriesPanel } from "~/components/bounty/EntriesPanel";
import { type Entry, EntrySheet } from "~/components/bounty/EntrySheet";
import { RichText } from "~/components/bounty/RichText";
import { Confetti } from "~/components/ar/Confetti";
import { AppShell } from "~/components/ar/AppShell";
import { ArButton, ArLinkButton } from "~/components/ar/ArButton";
import { StatBlock } from "~/components/ar/Badges";
import { SegmentedTabs } from "~/components/ar/SegmentedTabs";
import { Skeleton, SkeletonText } from "~/components/ar/Skeleton";
import {
  type BountyDetail,
  deadlineLabel,
  formatAmount,
  formatUsd,
  TONE_CLASS,
  viewerBadge,
} from "~/lib/bounty";
import { useAuth } from "~/hooks/use-ar-auth";
import {
  useBountyAttention,
  useBountySeen,
} from "~/hooks/use-bounty-attention";
import { cn } from "~/lib/utils";
import { env } from "~/env";
import { PageBody } from "~/ui/page-header";
import { api } from "~/utils/api";

type Section = "brief" | "entries" | "chat" | "discussion";
const SECTIONS: Section[] = ["brief", "entries", "chat", "discussion"];

/**
 * ── /bounty/[id] ───────────────────────────────────────────────────────────
 *
 * One bounty, and one clear next step. The pinned bar at the bottom always
 * says the single thing you can do right now — sign in, join, top up, send
 * an entry — so the page never asks you to work out where you stand.
 *
 * On Chat and Discussion that bar becomes the message box instead, where
 * the keyboard pushes it, rather than stacking a composer on top of an
 * action button.
 *
 * The brief is public. Your entries and the brand chat are yours alone, so
 * they're locked (and say why) until you join.
 */
export default function BountyDetailScreen({ id }: { id: number }) {
  const params = useSearchParams();
  const valid = Number.isInteger(id);

  const user = useAuth((s) => s.user);
  const requireAuth = useAuth((s) => s.requireAuth);

  const [section, setSection] = useState<Section>("brief");
  const [sheet, setSheet] = useState<{ open: boolean; editing: Entry | null }>({
    open: false,
    editing: null,
  });
  // The discussion composer is either a new comment or a reply to one.
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(
    null,
  );

  // Deep links from "Needs you" land straight on the chat.
  useEffect(() => {
    const s = params?.get("section");
    if (s && (SECTIONS as string[]).includes(s)) {
      setSection(s as Section);
    }
  }, [params]);

  const detail = api.bounty.byId.useQuery(
    { id },
    { enabled: valid, retry: (n, e) => e.data?.code !== "NOT_FOUND" && n < 2 },
  );
  const bounty = detail.data;
  const joined = Boolean(bounty?.viewer.joined);

  const thread = api.bounty.thread.useQuery(
    { bountyId: id },
    {
      enabled: valid && joined && section === "chat",
      // No push channel; poll while the chat is actually on screen.
      refetchInterval: 15_000,
    },
  );

  // ── Seen + win celebration ───────────────────────────────────────────
  const { unseen, ready: attentionReady } = useBountyAttention();
  const markSeen = useBountySeen((s) => s.markSeen);
  const [confetti, setConfetti] = useState(0);
  // Per bounty id: navigating from one bounty to another reuses this page.
  const handledId = useRef<number | null>(null);
  useEffect(() => {
    if (!bounty || !attentionReady || handledId.current === bounty.id) return;
    handledId.current = bounty.id;
    // First time opening a bounty you won: the moment gets its confetti.
    if (unseen.some((u) => u.kind === "won" && u.bountyId === bounty.id)) {
      setConfetti((n) => n + 1);
    }
    markSeen(bounty.id);
  }, [bounty, attentionReady, unseen, markSeen]);
  // A reply arriving while you're reading the chat is already seen.
  useEffect(() => {
    if (section === "chat" && thread.dataUpdatedAt && valid) markSeen(id);
  }, [section, thread.dataUpdatedAt, id, valid, markSeen]);

  if (!valid || detail.isLoading) return <DetailSkeleton />;

  if (!bounty) {
    return (
      <AppShell tabs={false}>
        <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="font-hud text-[15px] font-bold uppercase tracking-[0.12em] text-ar-dim">
            {detail.error?.data?.code === "NOT_FOUND"
              ? "Bounty not found"
              : "Couldn't load this bounty"}
          </p>
          <ArLinkButton href="/bounties" variant="primary">
            All bounties
          </ArLinkButton>
        </div>
      </AppShell>
    );
  }

  const badge = viewerBadge(bounty);
  const deadline = deadlineLabel(bounty.endDate);
  const locked = !joined && (section === "entries" || section === "chat");

  const cover = bounty.imageUrls[0] ?? null;

  return (
    <div className="relative">
      {/* Same pattern as the item page: blurred art backdrop, art left, details right. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="size-full scale-125 object-cover opacity-30 blur-3xl" />
        ) : (
          <div className="size-full bg-[radial-gradient(circle_at_30%_0%,hsl(var(--primary)/0.25),transparent_60%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/80 to-background" />
      </div>

      <PageBody wide className="relative">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/bounties" className="hover:text-foreground">
            Bounties
          </Link>
          <span>/</span>
          <span className="truncate text-foreground">{bounty.title}</span>
        </nav>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
          <div className="lg:sticky lg:top-24">
            <div className="glass overflow-hidden rounded-3xl p-1.5 shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.5)]">
              <div className="overflow-hidden rounded-[1.25rem]">
                <Hero bounty={bounty} />
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-5">
            <header className="space-y-3">
              <Link href={`/creator/${bounty.brand.id}`} className="glass inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-semibold hover:border-primary/40">
                <BrandAvatar src={bounty.brand.avatarUrl} loading="eager" className="size-6 rounded-full" />
                {bounty.brand.name}
              </Link>
              <h1 className="font-hud text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{bounty.title}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("font-hud inline-flex h-[22px] items-center rounded-full border px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em]", TONE_CLASS[badge.tone])}>{badge.label}</span>
                {deadline && (
                  <span className={cn("glass font-hud inline-flex h-[22px] items-center gap-1 rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em]", deadline.urgent ? "text-rarity-legendary" : "text-muted-foreground")}>
                    <Clock size={10} strokeWidth={2.6} />
                    {deadline.text}
                  </span>
                )}
              </div>
            </header>

            <div className="glass space-y-4 rounded-2xl p-4 shadow-[0_20px_60px_-25px_hsl(var(--primary)/0.4)] sm:p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="label-caps">Reward per winner</p>
                  <p className="font-hud text-4xl font-bold tabular-nums">
                    <span className="text-gradient">{formatUsd(bounty.rewardUsd)}</span>
                  </p>
                </div>
                <p className="font-hud text-sm font-semibold tabular-nums text-muted-foreground">
                  {formatAmount(bounty.rewardAsset)} {bounty.assetCode}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["Spots left", `${bounty.spotsLeft}/${bounty.totalWinners}`],
                  ["Joined", bounty.participants],
                  ["Entries", bounty.totalEntries],
                ].map(([k, v]) => (
                  <div key={String(k)} className="rounded-xl bg-foreground/[0.04] p-2.5 text-center ring-1 ring-foreground/[0.06]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k}</p>
                    <p className="font-hud text-lg font-bold tabular-nums">{v}</p>
                  </div>
                ))}
              </div>
              {bounty.viewer.won && <WinnerBanner bounty={bounty} />}
              <PrimaryAction
                bounty={bounty}
                onSubmit={() => {
                  setSection("entries");
                  setSheet({ open: true, editing: null });
                }}
                onShowEntries={() => setSection("entries")}
              />
            </div>

            <SegmentedTabs
              layoutId="bounty-detail-sections"
              value={section}
              onChange={setSection}
              className="glass"
              tabs={[
                { id: "brief", label: "Brief" },
                { id: "entries", label: "My entries", count: joined ? bounty.viewer.entryCount : undefined, icon: joined ? undefined : Lock },
                { id: "chat", label: "Chat", icon: joined ? undefined : Lock },
                { id: "discussion", label: "Discussion", count: bounty.commentCount || undefined },
              ]}
            />

            <div className="glass space-y-4 rounded-2xl p-4 sm:p-5">
              {locked ? (
                <LockedNote section={section} />
              ) : section === "brief" ? (
                <Brief bounty={bounty} />
              ) : section === "entries" ? (
                <EntriesPanel bountyId={bounty.id} open={bounty.open} onEdit={(entry) => setSheet({ open: true, editing: entry })} />
              ) : section === "chat" ? (
                <>
                  <ChatPanel messages={thread.data} loading={thread.isLoading} brand={bounty.brand} />
                  <Composer key="chat" placeholder={`Message ${bounty.brand.name}`} bountyId={bounty.id} kind="chat" />
                </>
              ) : (
                <>
                  <DiscussionPanel
                    bountyId={bounty.id}
                    onReply={(t) => {
                      if (!requireAuth("bounty")) return;
                      setReplyTo(t);
                    }}
                  />
                  {user && (
                    <Composer
                      key={`talk-${replyTo?.id ?? 0}`}
                      placeholder={replyTo ? `Reply to ${replyTo.name}` : "Add to the discussion"}
                      bountyId={bounty.id}
                      kind="comment"
                      replyTo={replyTo}
                      onCancelReply={() => setReplyTo(null)}
                      onSent={() => setReplyTo(null)}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </PageBody>

      <EntrySheet bountyId={bounty.id} open={sheet.open} editing={sheet.editing} onClose={() => setSheet({ open: false, editing: null })} />
      <Confetti trigger={confetti} rarity="legendary" />
    </div>
  );
}

// ── Pieces ──────────────────────────────────────────────────────────────

function Hero({ bounty }: { bounty: BountyDetail }) {
  const [index, setIndex] = useState(0);
  const images = bounty.imageUrls;

  return (
    <div className="relative h-[220px]">
      {images.length > 0 ? (
        <div
          className="ar-scroll-x flex h-full snap-x snap-mandatory"
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              loading={i === 0 ? "eager" : "lazy"}
              className="h-full w-full shrink-0 snap-center object-cover"
            />
          ))}
        </div>
      ) : (
        <div className="ar-grid h-full w-full bg-gradient-to-br from-ar-green/25 via-ar-surface to-ar-bg" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ar-void/70 via-transparent to-ar-bg" />

      {images.length > 1 && (
        <div className="absolute bottom-11 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((src, i) => (
            <span
              key={src}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-4 bg-ar-text" : "w-1.5 bg-ar-text/40",
              )}
            />
          ))}
        </div>
      )}

      <div
        className="absolute inset-x-0 top-0 flex items-center justify-between px-4"
        style={{ paddingTop: "calc(var(--ar-top-inset) + 14px)" }}
      >
        <BackToBounties />
        <button
          aria-label="Share this bounty"
          onClick={() => {
            void navigator
              .share?.({ title: bounty.title, url: window.location.href })
              .catch(() => undefined);
          }}
          className="ar-glass flex h-9 w-9 items-center justify-center rounded-full text-ar-text"
        >
          <Share2 size={15} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

function BackToBounties() {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        if (window.history.length > 1) router.back();
        else void router.push("/bounties");
      }}
      aria-label="Back"
      className="ar-glass flex h-9 w-9 items-center justify-center rounded-full text-ar-text"
    >
      <ChevronLeft size={17} strokeWidth={2.4} />
    </button>
  );
}

function Brief({ bounty }: { bounty: BountyDetail }) {
  return (
    <div>
      <RichText html={bounty.description} />
      {bounty.requiredBalance > 0 && (
        <p className="mt-4 flex items-start gap-2 rounded-ar border border-ar-line bg-white/[0.03] px-3.5 py-2.5 text-[12px] leading-relaxed text-ar-dim">
          <Wallet size={14} strokeWidth={2.3} className="mt-0.5 shrink-0 text-ar-green-hot" />
          To join you need to hold at least{" "}
          {formatAmount(bounty.requiredBalance)} {bounty.assetCode} in your wallet.
        </p>
      )}
    </div>
  );
}

function LockedNote({ section }: { section: Section }) {
  return (
    <div className="py-10 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-ar-line-bright bg-white/[0.04] text-ar-faint">
        <Lock size={17} strokeWidth={2.3} />
      </span>
      <p className="font-hud mt-3 text-[13px] font-bold uppercase tracking-[0.14em] text-ar-dim">
        Join to unlock
      </p>
      <p className="mx-auto mt-1.5 max-w-[17rem] text-[12.5px] leading-relaxed text-ar-faint">
        {section === "chat"
          ? "Once you've joined you can message the brand privately about this bounty."
          : "Once you've joined, the entries you send and how they're doing in review show up here."}
      </p>
    </div>
  );
}

function WinnerBanner({ bounty }: { bounty: BountyDetail }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-5 mt-3 flex items-center gap-3 rounded-ar-lg border border-rarity-legendary/50 bg-rarity-legendary/10 p-3.5"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-rarity-legendary/20 text-rarity-legendary">
        <Trophy size={19} strokeWidth={2.3} />
      </span>
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-ar-text">You won this bounty</p>
        <p className="mt-0.5 text-[12px] leading-snug text-ar-dim">
          {formatAmount(bounty.rewardAsset)} {bounty.assetCode} has been sent to
          your wallet.
        </p>
      </div>
    </motion.div>
  );
}

function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    // Sticks just above the site's floating bottom nav while the brief scrolls.
    <div className="ar-tabbar-surface sticky bottom-[calc(var(--safe-bottom)+5.75rem)] z-30 mx-3 mt-4 rounded-ar-xl px-4 pb-3 pt-3 sm:bottom-[6.5rem]">
      {children}
    </div>
  );
}

/**
 * The one thing you can do next, worked out in the order a fan meets the
 * obstacles: is it yours, is it over, are you signed in, can you afford to
 * join, have you joined.
 */
function PrimaryAction({
  bounty,
  onSubmit,
  onShowEntries,
}: {
  bounty: BountyDetail;
  onSubmit: () => void;
  onShowEntries: () => void;
}) {
  const user = useAuth((s) => s.user);
  const requireAuth = useAuth((s) => s.requireAuth);
  const utils = api.useUtils();

  const needsBalance = bounty.requiredBalance > 0 && !bounty.viewer.joined;
  const balance = api.user.platformBalance.useQuery(undefined, {
    enabled: Boolean(user) && needsBalance && bounty.open,
    staleTime: 30_000,
  });

  const join = api.bounty.join.useMutation({
    onSuccess: () =>
      Promise.all([
        utils.bounty.byId.invalidate({ id: bounty.id }),
        utils.bounty.mine.invalidate(),
        utils.bounty.list.invalidate(),
      ]),
  });

  const note = (text: string) => (
    <p className="font-hud mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-ar-faint">
      {text}
    </p>
  );

  if (bounty.isOwner) {
    return (
      <>
        {note("You posted this bounty")}
        <ArButton
          block
          size="lg"
          variant="primary"
          onClick={() => window.open(`${env.NEXT_PUBLIC_BRAND_PORTAL_URL.replace(/\/$/, "")}/bounties/${bounty.id}`, "_blank", "noopener")}
        >
          Manage in the brand portal
        </ArButton>
      </>
    );
  }

  if (bounty.viewer.won) {
    return (
      <ArButton block size="lg" variant="gold" icon={Trophy} onClick={onShowEntries}>
        See your entries
      </ArButton>
    );
  }

  if (!bounty.open) {
    return (
      <>
        {bounty.viewer.joined && note("No more entries — results are final")}
        <ArButton block size="lg" disabled>
          Bounty closed
        </ArButton>
      </>
    );
  }

  if (!user) {
    return (
      <ArButton
        block
        size="lg"
        variant="primary"
        icon={Wallet}
        onClick={() => requireAuth("bounty")}
      >
        Sign in to join
      </ArButton>
    );
  }

  if (!bounty.viewer.joined) {
    if (needsBalance && balance.isLoading) {
      return (
        <ArButton block size="lg" variant="primary" busy>
          Checking balance
        </ArButton>
      );
    }
    const short =
      needsBalance && balance.data
        ? bounty.requiredBalance - balance.data.balance
        : 0;
    if (short > 0) {
      return (
        <>
          {note(`You hold ${formatAmount(balance.data!.balance)} ${bounty.assetCode}`)}
          <ArButton block size="lg" disabled>
            Need {formatAmount(short)} more {bounty.assetCode}
          </ArButton>
        </>
      );
    }
    return (
      <>
        {join.error && (
          <p className="mb-2 text-center text-[12px] text-ar-danger">{join.error.message}</p>
        )}
        <ArButton
          block
          size="lg"
          variant="primary"
          icon={Users}
          busy={join.isPending}
          onClick={() => join.mutate({ id: bounty.id })}
        >
          {join.isPending ? "Joining" : "Join bounty"}
        </ArButton>
      </>
    );
  }

  return (
    <ArButton block size="lg" variant="primary" icon={Send} onClick={onSubmit}>
      {bounty.viewer.entryCount > 0 ? "Send another entry" : "Send your entry"}
    </ArButton>
  );
}

function Composer({
  bountyId,
  kind,
  placeholder,
  replyTo,
  onCancelReply,
  onSent,
}: {
  bountyId: number;
  kind: "chat" | "comment";
  placeholder: string;
  replyTo?: { id: number; name: string } | null;
  onCancelReply?: () => void;
  onSent?: () => void;
}) {
  const utils = api.useUtils();
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  const sendMessage = api.bounty.sendMessage.useMutation({
    onSuccess: () => utils.bounty.thread.invalidate({ bountyId }),
  });
  const addComment = api.bounty.addComment.useMutation({
    onSuccess: () =>
      Promise.all([
        utils.bounty.comments.invalidate({ bountyId }),
        utils.bounty.byId.invalidate({ id: bountyId }),
      ]),
  });
  const pending = sendMessage.isPending || addComment.isPending;
  const error = sendMessage.error ?? addComment.error;

  const submit = async () => {
    const content = text.trim();
    if (!content || pending) return;
    if (kind === "chat") {
      await sendMessage.mutateAsync({ bountyId, content });
    } else {
      await addComment.mutateAsync({ bountyId, content, parentId: replyTo?.id });
    }
    setText("");
    onSent?.();
  };

  return (
    <div>
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-full bg-white/[0.05] px-3 py-1.5">
          <span className="truncate text-[11.5px] text-ar-dim">
            Replying to <span className="text-ar-text">{replyTo.name}</span>
          </span>
          <button onClick={onCancelReply} aria-label="Cancel reply" className="text-ar-faint">
            <X size={14} strokeWidth={2.4} />
          </button>
        </div>
      )}
      {error && <p className="mb-2 text-[12px] text-ar-danger">{error.message}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit().catch(() => undefined);
        }}
        className="flex items-end gap-2"
      >
        <label htmlFor={`composer-${kind}`} className="sr-only">
          {placeholder}
        </label>
        <textarea
          id={`composer-${kind}`}
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit().catch(() => undefined);
            }
          }}
          rows={1}
          maxLength={kind === "chat" ? 2000 : 1000}
          placeholder={placeholder}
          className="ar-bevel max-h-28 min-h-[44px] flex-1 resize-none rounded-[22px] px-4 py-3 text-[14px] leading-snug text-ar-text outline-none placeholder:text-ar-faint"
        />
        <button
          type="submit"
          disabled={!text.trim() || pending}
          aria-label="Send"
          className="ar-key ar-key-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
        >
          <Send size={17} strokeWidth={2.3} />
        </button>
      </form>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <AppShell tabs={false}>
      <div className="h-full" role="status" aria-label="Loading bounty">
        <Skeleton className="h-[220px] w-full" rounded="rounded-none" />
        <div className="px-5">
          <Skeleton className="-mt-8 h-[56px] w-[56px]" rounded="rounded-[16px]" />
          <Skeleton rounded="rounded-full" className="mt-3 h-5 w-4/5" />
          <Skeleton rounded="rounded-full" className="mt-3 h-5 w-24" />
          <Skeleton className="mt-4 h-[118px] w-full" rounded="rounded-ar-lg" />
          <Skeleton className="mt-5 h-11 w-full" />
          <SkeletonText lines={4} className="mt-4" />
        </div>
      </div>
    </AppShell>
  );
}
