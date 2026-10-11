import { Users } from "lucide-react";
import type { Metadata } from "next";

import { CreatorCard } from "~/components/creator/creator-card";
import { CreatorSearch, LoadMoreCreators } from "~/components/creator/creator-list";
import { serverApi } from "~/server/api/server";
import { EmptyState } from "~/ui/empty-state";
import { PageBody, PageHeader } from "~/ui/page-header";

export const metadata: Metadata = {
  title: "Creators",
  description: "Discover brands and creators on Wadzzo — follow them, collect their drops and join their memberships.",
  alternates: { canonical: "/creators" },
};

export default async function CreatorsPage({ searchParams }: PageProps<"/creators">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) || undefined : undefined;
  const first = await (await serverApi()).creator.list({ search: q, limit: 24 });

  return (
    <PageBody wide className="space-y-6">
      <PageHeader eyebrow="Creators" title={<span>Brands on <span className="text-gradient">Wadzzo</span></span>} description="Follow creators to unlock their posts and members-only drops." actions={<CreatorSearch value={q} />} />
      {first.items.length === 0 ? (
        <EmptyState icon={Users} title="No creators found" description="Try a different name." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-6">
            {first.items.map((c) => (
              <CreatorCard key={c.id} creator={c} />
            ))}
          </div>
          {first.nextCursor && <LoadMoreCreators key={q ?? ""} search={q} cursor={first.nextCursor} />}
        </>
      )}
    </PageBody>
  );
}
