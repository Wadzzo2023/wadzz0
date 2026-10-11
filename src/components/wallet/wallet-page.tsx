"use client";

import { ArrowDownToLine, ArrowLeftRight, Check, Coins, Copy, Gift, Plus, Send, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

import { RecentActivity } from "~/components/activity/activity-view";
import { SignedIn } from "~/components/shell/sign-in-prompt";
import { Button } from "~/components/shadcn/ui/button";
import { useCurrency } from "~/hooks/use-currency";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { useSignAndConfirm } from "~/hooks/use-sign-and-confirm";
import { isCustodial } from "~/lib/custodial";
import { creatorHref } from "~/lib/creator";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { cn } from "~/lib/utils";
import { EmptyState } from "~/ui/empty-state";
import { ErrorState } from "~/ui/error-state";
import { PageBody } from "~/ui/page-header";
import { Avatar } from "~/ui/person";
import { Skeleton } from "~/ui/skeleton";
import { api, type RouterOutputs } from "~/utils/api";

import { SendDialog, type SendableAsset } from "./send-dialog";
import { GetTokensDialog, ReceiveDialog, SwapDialog } from "./wallet-dialogs";

type Balances = RouterOutputs["wallet"]["balances"];
type Gift = RouterOutputs["wallet"]["gifts"][number];

const num = (n: number, max = 2) => n.toLocaleString("en-US", { maximumFractionDigits: max });
export const shortAddr = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;

export function WalletPage() {
  return (
    <SignedIn icon={Wallet} title="Your wallet" description="Sign in to see your balances, get tokens and accept gifts.">
      <WalletView />
    </SignedIn>
  );
}

type DialogKind = "get" | "swap" | "receive" | "send" | null;

/** Everything sendable, in the order it's listed: XLM, the platform token, page tokens, then items and other tokens. */
function sendableAssets(b: Balances): SendableAsset[] {
  if (!b.active) return [];
  return [
    { code: "XLM", issuer: null, balance: b.xlm.spendable, label: "Stellar Lumens", thumbnail: null },
    ...(b.platform.trusted ? [{ code: b.platform.code, issuer: PLATFORM_ASSET.issuer, balance: b.platform.balance, label: "Platform token", thumbnail: null }] : []),
    ...b.pageTokens.map((t) => ({ code: t.code, issuer: t.issuer, balance: t.balance, label: `${t.creator.name} page token`, thumbnail: t.thumbnail })),
    ...b.tokens.map((t) => ({ code: t.code, issuer: t.issuer, balance: t.balance, label: t.name ?? "Token", thumbnail: t.thumbnail })),
  ];
}

/** Balances up top with the main actions, then every asset (each sendable), XLM details and pending gifts. */
function WalletView() {
  const balances = api.wallet.balances.useQuery();
  const [open, setOpen] = useState<DialogKind>(null);
  const [sendAsset, setSendAsset] = useState<SendableAsset | undefined>(undefined);
  const me = useRequireAuth().session?.user.id;
  const assets = balances.data ? sendableAssets(balances.data) : [];
  const send = (a?: SendableAsset) => {
    setSendAsset(a);
    setOpen("send");
  };

  return (
    <PageBody wide className="space-y-6">
      <h1 className="sr-only">Wallet</h1>
      {balances.isLoading ? (
        <>
          <Skeleton className="h-60 rounded-3xl" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
          </div>
        </>
      ) : balances.error ? (
        <ErrorState message={balances.error.message} onRetry={() => void balances.refetch()} />
      ) : balances.data ? (
        <>
          <BalanceHero b={balances.data} onAction={(k) => (k === "send" ? send() : setOpen(k))} />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <AssetsCard assets={assets} balances={balances.data} onSend={send} />
            <div className="space-y-4">
              {balances.data.active ? <XlmCard xlm={balances.data.xlm} /> : <InactiveCard />}
              <GiftsCard />
            </div>
          </div>
          {me && <RecentActivity me={me} />}
        </>
      ) : null}

      {open === "get" && <GetTokensDialog onClose={() => setOpen(null)} />}
      {open === "swap" && balances.data?.active && <SwapDialog balance={balances.data.platform.balance} code={balances.data.platform.code} onClose={() => setOpen(null)} />}
      {open === "send" && assets.length > 0 && <SendDialog assets={assets} initial={sendAsset} onClose={() => setOpen(null)} />}
      {open === "receive" && balances.data && <ReceiveDialog address={balances.data.address} onClose={() => setOpen(null)} />}
    </PageBody>
  );
}

function CopyAddress({ address, className }: { address: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () =>
    void navigator.clipboard.writeText(address).then(
      () => {
        setCopied(true);
        toast.success("Address copied");
        setTimeout(() => setCopied(false), 1500);
      },
      () => toast.error("Couldn't copy the address"),
    );
  return (
    <button type="button" onClick={copy} title={address} className={cn("inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-mono text-xs ring-1 ring-white/15 backdrop-blur-md transition-colors hover:bg-white/20", className)}>
      {shortAddr(address)} {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}

function BalanceHero({ b, onAction }: { b: Balances; onAction: (k: DialogKind) => void }) {
  const { session } = useRequireAuth();
  const { currency } = useCurrency();
  // card top-ups are only for custodial (email/social) accounts
  const custodial = isCustodial(session?.user.walletType);
  const actions = [
    ...(custodial ? [{ id: "get" as const, label: "Get tokens", icon: Plus, primary: true }] : []),
    ...(b.active ? [{ id: "send" as const, label: "Send", icon: Send, primary: !custodial }] : []),
    ...(b.active ? [{ id: "swap" as const, label: "Swap", icon: ArrowLeftRight, primary: false }] : []),
    { id: "receive" as const, label: "Receive", icon: ArrowDownToLine, primary: false },
  ];
  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-black p-6 text-white ring-1 ring-foreground/10 sm:p-8">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,hsl(var(--primary)/0.45),transparent_55%),radial-gradient(circle_at_90%_85%,hsl(190_90%_50%/0.3),transparent_55%),radial-gradient(circle_at_60%_0%,hsl(270_80%_60%/0.2),transparent_50%)]" />
      <div aria-hidden className="absolute -right-16 -top-16 -z-10 size-64 rounded-full bg-primary/20 blur-3xl" />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="label-caps text-[hsl(112_85%_62%)]">{b.active ? `${b.platform.code} balance` : "Wallet"}</p>
            <CopyAddress address={b.address} />
          </div>
          {b.active ? (
            <>
              {currency === "USD" && b.platform.usd != null ? (
                <>
                  <p className="break-all font-hud text-4xl font-bold leading-none tracking-tight tabular-nums sm:text-6xl">{b.platform.usd.toLocaleString("en-US", { style: "currency", currency: "USD" })}</p>
                  <p className="text-sm text-white/70">
                    {num(b.platform.balance)} {b.platform.code}
                  </p>
                </>
              ) : (
                <>
                  <p className="break-all font-hud text-4xl font-bold leading-none tracking-tight tabular-nums sm:text-6xl">
                    {num(b.platform.balance)} <span className="text-lg font-semibold text-white/60 sm:text-2xl">{b.platform.code}</span>
                  </p>
                  {b.platform.usd != null && <p className="text-sm text-white/70">≈ {b.platform.usd.toLocaleString("en-US", { style: "currency", currency: "USD" })}</p>}
                </>
              )}
            </>
          ) : (
            <p className="max-w-md text-white/75">
              Your Stellar account isn&apos;t active yet. {custodial ? "Getting tokens activates it for you." : "Send at least 1 XLM to this address from your wallet to activate it."}
            </p>
          )}
        </div>
        <div className={cn("grid gap-2 sm:flex", actions.length >= 4 ? "grid-cols-4" : actions.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onAction(a.id)}
              className={cn(
                "flex h-12 flex-col items-center justify-center gap-0.5 rounded-2xl px-4 text-xs font-semibold transition-all sm:flex-row sm:gap-2 sm:text-sm",
                a.primary
                  ? "bg-primary text-primary-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.4),0_0_24px_-4px_hsl(var(--primary)/0.8)] hover:brightness-110"
                  : "bg-white/10 ring-1 ring-white/15 backdrop-blur-md hover:bg-white/20",
              )}
            >
              <a.icon className="size-4" /> {a.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function XlmCard({ xlm }: { xlm: Extract<Balances, { active: true }>["xlm"] }) {
  const rows = [
    { label: "Spendable", value: xlm.spendable, hint: "Available for fees and purchases" },
    { label: "Reserved", value: xlm.reserved, hint: "Locked by Stellar for your account and trustlines" },
  ];
  return (
    <section className="glass space-y-4 rounded-2xl p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-hud font-bold">XLM</h2>
        <p className="font-hud text-2xl font-bold tabular-nums">
          {num(xlm.total, 4)} <span className="text-sm font-medium text-muted-foreground">total</span>
        </p>
      </div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3 rounded-xl bg-foreground/[0.04] px-3.5 py-3 ring-1 ring-foreground/[0.06]">
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{r.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{r.hint}</span>
            </span>
            <span className="font-hud font-bold tabular-nums">{num(r.value, 4)}</span>
          </li>
        ))}
      </ul>
      {xlm.total > 0 && (
        <div className="h-2 overflow-hidden rounded-full bg-foreground/[0.08]" aria-hidden>
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400" style={{ width: `${Math.max(2, Math.min(100, (xlm.spendable / xlm.total) * 100))}%` }} />
        </div>
      )}
    </section>
  );
}

function InactiveCard() {
  return (
    <section className="glass space-y-2 rounded-2xl p-5">
      <h2 className="font-hud font-bold">XLM</h2>
      <p className="text-sm text-muted-foreground">Stellar accounts need a small XLM reserve before they can hold anything.</p>
    </section>
  );
}

/** Every asset in the wallet, each with Send. Items link to their page, page tokens to the brand's membership. */
function AssetsCard({ assets, balances, onSend }: { assets: SendableAsset[]; balances: Balances; onSend: (a: SendableAsset) => void }) {
  const hrefFor = (a: SendableAsset) => {
    if (!balances.active || !a.issuer) return null;
    const page = balances.pageTokens.find((t) => t.code === a.code && t.issuer === a.issuer);
    if (page) return `${creatorHref(page.creator)}?tab=membership`;
    const item = balances.tokens.find((t) => t.code === a.code && t.issuer === a.issuer);
    return item?.itemId ? `/item/${item.itemId}` : null;
  };
  return (
    <section className="glass space-y-3 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-hud font-bold">Assets</h2>
        <span className="text-xs text-muted-foreground">{assets.length} in your wallet</span>
      </div>
      {assets.length === 0 ? (
        <EmptyState icon={Coins} title="Nothing here yet" description="Your XLM, tokens and items will show up here." className="border-0 py-6" />
      ) : (
        <ul className="divide-y divide-foreground/[0.06]">
          {assets.map((a) => {
            const href = hrefFor(a);
            const body = (
              <>
                {a.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.thumbnail} alt="" className="size-10 shrink-0 rounded-xl object-cover" />
                ) : (
                  <Avatar name={a.code} className="size-10 shrink-0" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{a.code}</span>
                  <span className="block truncate text-xs text-muted-foreground">{a.label}</span>
                </span>
              </>
            );
            return (
              <li key={`${a.code}:${a.issuer ?? "native"}`} className="flex items-center gap-3 py-2.5">
                {href ? (
                  <Link href={href} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg hover:opacity-80">
                    {body}
                  </Link>
                ) : (
                  <span className="flex min-w-0 flex-1 items-center gap-3">{body}</span>
                )}
                <span className="font-hud font-bold tabular-nums">{num(a.balance, a.code === "XLM" ? 4 : 2)}</span>
                <Button size="sm" variant="ghost" className="rounded-lg" disabled={a.balance <= 0} onClick={() => onSend(a)} aria-label={`Send ${a.code}`}>
                  <Send className="size-3.5" /> <span className="hidden sm:inline">Send</span>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function GiftsCard() {
  const gifts = api.wallet.gifts.useQuery();
  return (
    <section className="glass space-y-3 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-hud font-bold">
          Pending gifts
          {!!gifts.data?.length && <span className="rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground tabular-nums">{gifts.data.length}</span>}
        </h2>
      </div>
      {gifts.isLoading ? (
        <Skeleton className="h-14 rounded-xl" />
      ) : !gifts.data?.length ? (
        <EmptyState icon={Gift} title="No gifts waiting" description="Tokens and items sent to you appear here to accept." className="border-0 py-4" />
      ) : (
        <ul className="space-y-2">
          {gifts.data.map((g) => (
            <GiftRow key={g.id} gift={g} />
          ))}
        </ul>
      )}
    </section>
  );
}

function GiftRow({ gift }: { gift: Gift }) {
  const claim = api.wallet.claimGift.useMutation({ onError: (e) => toast.error(e.message) });
  const sign = useSignAndConfirm();
  const utils = api.useUtils();
  const accept = async () => {
    const res = await claim.mutateAsync({ balanceId: gift.id }).catch(() => null);
    if (res && (await sign.run(res))) {
      toast.success(`${num(gift.amount)} ${gift.code} added to your wallet`);
      await Promise.all([utils.wallet.gifts.invalidate(), utils.wallet.balances.invalidate()]);
    }
  };
  return (
    <li className="flex items-center gap-3 rounded-xl bg-foreground/[0.04] p-3 ring-1 ring-foreground/[0.06]">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Gift className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {num(gift.amount)} {gift.code}
        </span>
        {gift.sponsor && <span className="block truncate text-xs text-muted-foreground">from {shortAddr(gift.sponsor)}</span>}
        {sign.error && <span className="block text-xs text-destructive">{sign.error}</span>}
      </span>
      <Button size="sm" className="rounded-lg" disabled={claim.isPending || sign.busy} onClick={() => void accept()}>
        {sign.step === "signing" ? "Confirm…" : sign.step === "confirming" ? "Confirming…" : "Accept"}
      </Button>
    </li>
  );
}
