import type { Metadata } from "next";

import BountyIndexScreen from "~/components/bounty/pages/bounty-index";

export const metadata: Metadata = {
  title: "Bounties",
  description: "Complete tasks for your favourite brands and win rewards on Wadzzo.",
  alternates: { canonical: "/bounties" },
};

/** Same bounty screens as the wadzzoAR app. */
export default function BountiesPage() {
  return <BountyIndexScreen />;
}
