import { Coins, Target, Trophy } from "lucide-react";
import type { Metadata } from "next";

import { BountyBrowser } from "~/components/bounty/bounty-browser";
import { formatUsd } from "~/lib/bounty";
import { serverApi } from "~/server/api/server";
import { PageBody } from "~/ui/page-header";
import { PageHero } from "~/ui/page-hero";

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
      <PageHero
        eyebrow="Bounties"
        title={
          <>
            Complete tasks, <span className="text-gradient">win rewards</span>
          </>
        }
        description="Brands post challenges. Join one, submit your entry, and get paid straight to your wallet if you win."
        image={cover}
        stats={[
          { icon: Target, label: "Open bounties", value: stats.open.toLocaleString("en-US") },
          { icon: Coins, label: "Reward pool", value: formatUsd(stats.poolUsd) },
          { icon: Trophy, label: "Paid instantly", value: "On-chain" },
        ]}
      />

      <PageBody wide className="pt-6">
        <BountyBrowser initial={first.items} />
      </PageBody>
    </>
  );
}
