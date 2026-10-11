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

  const cover = first.items.find((b) => b.imageUrl)?.imageUrl ?? null;

  return (
    <>
      {/* Full-width banner, same size as the home carousel. */}
      <header className="relative h-[40svh] min-h-[300px] w-full overflow-hidden bg-black text-white">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="absolute inset-0 size-full object-cover opacity-60" />
        )}
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,hsl(var(--primary)/0.35),transparent_55%),radial-gradient(circle_at_85%_75%,hsl(190_90%_50%/0.25),transparent_55%)]" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end gap-5 px-4 pb-6 sm:px-6 sm:pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-2">
            <p className="label-caps text-[hsl(112_85%_62%)]">Bounties</p>
            <h1 className="font-hud text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Complete tasks, <span className="text-gradient">win rewards</span>
            </h1>
            <p className="text-sm text-white/75 sm:text-base">Brands post challenges. Join one, submit your entry, and get paid straight to your wallet if you win.</p>
          </div>
          <dl className="grid grid-cols-3 gap-2 sm:gap-3 lg:w-[30rem] lg:shrink-0">
            {[
              { icon: Target, label: "Open bounties", value: stats.open.toLocaleString("en-US") },
              { icon: Coins, label: "Reward pool", value: formatUsd(stats.poolUsd) },
              { icon: Trophy, label: "Paid instantly", value: "On-chain" },
            ].map((s) => (
              <div key={s.label} className="min-w-0 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur-xl sm:p-4">
                <s.icon className="mb-1.5 size-4 text-[hsl(112_85%_62%)]" />
                <dd className="truncate font-hud text-lg font-bold sm:text-xl">{s.value}</dd>
                <dt className="truncate text-[10px] font-semibold uppercase tracking-wider text-white/60">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <PageBody wide className="pt-6">
        <BountyBrowser initial={first.items} />
      </PageBody>
    </>
  );
}
