import type { Metadata } from "next";

import { FeedView } from "~/components/post/feed-view";
import { PageBody, PageHeader } from "~/ui/page-header";

export const metadata: Metadata = {
  title: "Feed",
  description: "Latest posts from creators on Wadzzo — drops, behind-the-scenes and members-only updates.",
  alternates: { canonical: "/feed" },
};

export default function FeedPage() {
  return (
    <PageBody className="space-y-6">
      <PageHeader className="mx-auto max-w-2xl" eyebrow="Feed" title={<span>What creators are <span className="text-gradient">posting</span></span>} />
      <FeedView />
    </PageBody>
  );
}
