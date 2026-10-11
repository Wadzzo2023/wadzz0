import { Coins, Target, Trophy } from "lucide-react";
import type { Metadata } from "next";

import { BountyBrowser } from "~/components/bounty/bounty-browser";
import { formatUsd } from "~/lib/bounty";
import { serverApi } from "~/server/api/server";
import { PageBody } from "~/ui/page-header";

export const metadata: Metadata = {
  title: "Bounties",
  description: "Complete tasks for your favourite brands and win rewards on Wadzzo.",
  alternates: { canonical: "/bounties" },
};

export const dynamic = "force-dynamic";

export default async function BountiesPage() {
  const api = await serverApi();
  const [first, stats] = await Promise.all([api.bounty.list({ filter: "open", limit: 18 }), api.bounty.stats()]);

  return (
    <PageBody wide className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-foreground/[0.06] p-6 sm:p-10">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,hsl(var(--primary)/0.22),transparent_55%),radial-gradient(circle_at_85%_80%,hsl(190_90%_50%/0.14),transparent_55%)]" />
        <div aria-hidden className="absolute -right-10 -top-10 size-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-2">
            <p className="label-caps text-primary">Bounties</p>
            <h1 className="font-hud text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Complete tasks, <span className="text-gradient">win rewards</span>
            </h1>
            <p className="text-muted-foreground">Brands post challenges. Join one, submit your entry, and get paid straight to your wallet if you win.</p>
          </div>
          <dl className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { icon: Target, label: "Open bounties", value: stats.open.toLocaleString("en-US") },
              { icon: Coins, label: "Reward pool", value: formatUsd(stats.poolUsd) },
              { icon: Trophy, label: "Paid instantly", value: "On-chain" },
            ].map((s) => (
              <div key={s.label} className="glass min-w-0 rounded-2xl p-3 sm:p-4">
                <s.icon className="mb-1.5 size-4 text-primary" />
                <dd className="truncate font-hud text-lg font-bold sm:text-2xl">{s.value}</dd>
                <dt className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <BountyBrowser initial={first.items} />
    </PageBody>
  );
}
