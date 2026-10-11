import type { Metadata } from "next";

import { BountyList } from "~/components/bounty/bounty-list";
import { serverApi } from "~/server/api/server";
import { PageBody, PageHeader } from "~/ui/page-header";

export const metadata: Metadata = {
  title: "Bounties",
  description: "Complete tasks for your favourite brands and win rewards on Wadzzo.",
  alternates: { canonical: "/bounties" },
};

export default async function BountiesPage() {
  const first = await (await serverApi()).bounty.list({ filter: "open", limit: 20 });
  return (
    <PageBody wide className="space-y-6">
      <PageHeader eyebrow="Bounties" title={<span>Complete tasks, <span className="text-gradient">win rewards</span></span>} description="Brands post challenges — join, submit your entry, and get paid if you win." />
      <BountyList initial={first.items} />
    </PageBody>
  );
}
