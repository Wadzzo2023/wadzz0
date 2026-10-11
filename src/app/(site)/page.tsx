import { CreatorStrip } from "~/components/creator/creator-strip";
import { HeroCarousel } from "~/components/home/hero-carousel";
import { ListingCard, ListingGrid } from "~/components/market/listing-card";
import { LoadMoreListings } from "~/components/market/load-more";
import { serverApi } from "~/server/api/server";
import { PageBody } from "~/ui/page-header";
import { Section } from "~/ui/section";

// Fresh listings on every visit, rendered on the server so search engines see them.
export const dynamic = "force-dynamic";

/** Home: new drops in the carousel, a strip of creators, then every item. */
export default async function HomePage() {
  const api = await serverApi();
  const [drops, creators, all] = await Promise.all([
    api.market.listings({ kind: "drops", limit: 6 }),
    api.creator.list({ limit: 20 }),
    api.market.listings({ kind: "all", limit: 24 }),
  ]);

  return (
    <>
      <HeroCarousel slides={drops.items} />
      <PageBody wide className="space-y-8 pt-6">
        {creators.items.length > 0 && <CreatorStrip creators={creators.items} />}
        <Section title="All items" description="Creator drops and fan resales." href="/marketplace">
          <ListingGrid>
            {all.items.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </ListingGrid>
          {all.nextCursor && <LoadMoreListings input={{ kind: "all", limit: 24 }} cursor={all.nextCursor} />}
        </Section>
      </PageBody>
    </>
  );
}
