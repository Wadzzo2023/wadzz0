"use client";

import { ArrowRight, Gift, Layers, Plus, Sparkles, Wallet } from "lucide-react";
import Link from "next/link";

import { PostCard } from "~/components/post/post-card";
import { Button } from "~/components/shadcn/ui/button";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { formatAmount } from "~/lib/stellar/quote";
import { EmptyState } from "~/ui/empty-state";
import { Section } from "~/ui/section";
import { Skeleton } from "~/ui/skeleton";
import { api } from "~/utils/api";

/** Signed out: what Wadzzo is and how to start. Signed in: a wallet summary. */
export function HomeHero() {
  const { signedIn, loading, openSignIn } = useRequireAuth();
  if (loading) return <Skeleton className="h-36 rounded-2xl" />;
  if (!signedIn) {
    return (
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-card to-card p-6 sm:p-10">
        <p className="label-caps text-primary">Collect · Trade · Play</p>
        <h1 className="mt-2 max-w-xl font-hud text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Own drops from the brands you love</h1>
        <p className="mt-3 max-w-lg text-muted-foreground">
          Buy digital items — art, music, video and 3D — straight from creators, resell them to other fans, join bounties and unlock members-only posts.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button size="lg" onClick={openSignIn}>
            Get started
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/marketplace">
              Explore marketplace <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    );
  }
  return <WalletSummary />;
}

function WalletSummary() {
  const balances = api.wallet.balances.useQuery();
  const owned = api.collection.owned.useQuery();
  const gifts = api.wallet.gifts.useQuery();
  const b = balances.data;
  const count = owned.data?.reduce((s, x) => s + x.owned + x.listed, 0);

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <Link href="/wallet" className="rounded-2xl border bg-gradient-to-br from-primary/15 to-card p-5 transition-colors hover:border-line-bright sm:col-span-2">
        <p className="label-caps flex items-center gap-1.5">
          <Wallet className="size-3.5" /> Wallet
        </p>
        {!b ? (
          <Skeleton className="mt-3 h-9 w-48" />
        ) : b.active ? (
          <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
            <p className="font-hud text-3xl font-bold tabular-nums">{formatAmount(b.platform.balance, b.platform.code)}</p>
            <p className="pb-1 text-sm text-muted-foreground">{formatAmount(b.xlm.spendable, "XLM")} available</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Your wallet isn&apos;t active yet — add funds to get started.</p>
        )}
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
          <Plus className="size-4" /> Add funds
        </span>
      </Link>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
        <Link href="/collection" className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-line-bright">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Layers className="size-5" />
          </span>
          <span>
            <span className="block font-hud text-xl font-bold tabular-nums">{count ?? "–"}</span>
            <span className="text-xs text-muted-foreground">Items owned</span>
          </span>
        </Link>
        <Link href="/wallet#gifts" className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-line-bright">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Gift className="size-5" />
          </span>
          <span>
            <span className="block font-hud text-xl font-bold tabular-nums">{gifts.data?.length ?? "–"}</span>
            <span className="text-xs text-muted-foreground">Gifts waiting</span>
          </span>
        </Link>
      </div>
    </section>
  );
}

/** Latest posts from the brands the viewer follows (signed in only). */
export function FollowingFeed() {
  const { signedIn } = useRequireAuth();
  const feed = api.post.feed.useQuery({ scope: "following", limit: 3 }, { enabled: signedIn });
  if (!signedIn) return null;
  return (
    <Section title="From brands you follow" href="/feed">
      {feed.isLoading ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : feed.data?.items.length ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {feed.data.items.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Sparkles} title="Follow a few brands" description="Posts and drops from brands you follow show up here." action={<Button asChild variant="outline"><Link href="/creators">Find creators</Link></Button>} />
      )}
    </Section>
  );
}
