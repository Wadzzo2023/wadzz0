import { CreatorCard } from "~/components/creator/creator-card";
import { HeroCarousel } from "~/components/home/hero-carousel";
import { ListingCard, ListingGrid } from "~/components/market/listing-card";
import { LoadMoreListings } from "~/components/market/load-more";
import { serverApi } from "~/server/api/server";
import { Carousel } from "~/ui/carousel";
import { PageBody } from "~/ui/page-header";
import { Section } from "~/ui/section";

// Fresh listings on every visit, rendered on the server so search engines see them.
export const dynamic = "force-dynamic";

/** Home: a full-screen carousel of featured drops, then items and creators. */
export default async function HomePage() {
  const api = await serverApi();
  const [drops, creators, all] = await Promise.all([
    api.market.listings({ kind: "drops", limit: 16 }),
    api.creator.list({ limit: 16 }),
    api.market.listings({ kind: "all", limit: 20 }),
  ]);

  return (
    <>
      <HeroCarousel slides={drops.items.slice(0, 5)} />
      <PageBody wide className="space-y-10 pt-8" >
        <div id="explore" className="scroll-mt-20" />
        {drops.items.length > 0 && (
          <Carousel title="New drops" description="Fresh from creators — minted for you when you buy." href="/marketplace?kind=drops">
            {drops.items.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </Carousel>
        )}

        {creators.items.length > 0 && (
          <Carousel title="Creators" description="Brands dropping on Wadzzo." href="/creators" itemClassName="w-[42%] sm:w-[28%] md:w-[22%] lg:w-[16%] xl:w-[13.5%]">
            {creators.items.map((c) => (
              <CreatorCard key={c.id} creator={c} />
            ))}
          </Carousel>
        )}

        {all.items.length > 0 && (
          <Section title="All items" description="Creator drops and fan resales." href="/marketplace">
            <ListingGrid>
              {all.items.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </ListingGrid>
            {all.nextCursor && <LoadMoreListings input={{ kind: "all", limit: 20 }} cursor={all.nextCursor} />}
          </Section>
        )}
      </PageBody>
    </>
  );
}
