import { BountyCard } from "~/components/bounty/bounty-card";
import { CreatorCard } from "~/components/creator/creator-card";
import { FollowingFeed, HomeHero } from "~/components/home/home-personal";
import { ListingCard } from "~/components/market/listing-card";
import { serverApi } from "~/server/api/server";
import { PageBody } from "~/ui/page-header";
import { Rail, Section } from "~/ui/section";

// Fresh listings on every visit, rendered on the server so search engines see them.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const api = await serverApi();
  const [drops, resales, bounties, creators] = await Promise.all([
    api.market.listings({ kind: "drops", limit: 10 }),
    api.market.listings({ kind: "resale", limit: 5 }),
    api.bounty.list({ filter: "open", limit: 4 }),
    api.creator.list({ limit: 5 }),
  ]);

  return (
    <PageBody wide className="space-y-10">
      <HomeHero />

      {drops.items.length > 0 && (
        <Section title="New drops" description="Fresh from creators — minted for you when you buy." href="/marketplace?kind=drops">
          <Rail>
            {drops.items.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </Rail>
        </Section>
      )}

      <FollowingFeed />

      {resales.items.length > 0 && (
        <Section title="Resale market" description="Items other fans are selling." href="/marketplace?kind=resale">
          <Rail>
            {resales.items.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </Rail>
        </Section>
      )}

      {bounties.items.length > 0 && (
        <Section title="Open bounties" description="Complete a task, win a reward." href="/bounties">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {bounties.items.map((b) => (
              <BountyCard key={b.id} bounty={b} />
            ))}
          </div>
        </Section>
      )}

      {creators.items.length > 0 && (
        <Section title="Popular creators" href="/creators">
          <Rail>
            {creators.items.map((c) => (
              <CreatorCard key={c.id} creator={c} />
            ))}
          </Rail>
        </Section>
      )}
    </PageBody>
  );
}
