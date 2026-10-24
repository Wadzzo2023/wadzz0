import { Crown, Flame, LayoutGrid, Repeat2 } from "lucide-react";
import Link from "next/link";

import { CreatorStrip } from "~/components/creator/creator-strip";
import { HeroCarousel } from "~/components/home/hero-carousel";
import { ListingCard, ListingGrid } from "~/components/market/listing-card";
import { LoadMoreListings } from "~/components/market/load-more";
import { MEDIA_META, MEDIA_TYPES } from "~/components/media/media-meta";
import { serverApi } from "~/server/api/server";
import { Rail, Section } from "~/ui/section";

// Fresh listings on every visit, rendered on the server so search engines see them.
export const dynamic = "force-dynamic";

const TYPE_TINT = {
  IMAGE: "bg-primary text-primary-foreground -rotate-1",
  VIDEO: "bg-side-mint text-side-ink rotate-1",
  MUSIC: "bg-pink text-side-ink -rotate-1",
  THREE_D: "bg-surface-3 text-foreground rotate-1",
} as const;

/** Home: featured drops, browse by type, top creators, fresh resales, then every item. */
export default async function HomePage() {
  const api = await serverApi();
  const [drops, creators, resales, all] = await Promise.all([
    api.market.listings({ kind: "drops", limit: 6 }),
    api.creator.list({ limit: 20 }),
    api.market.listings({ kind: "resale", limit: 8 }),
    api.market.listings({ kind: "all", limit: 24 }),
  ]);

  return (
    <>
      <HeroCarousel slides={drops.items} />

      <div className="mx-auto max-w-[88rem] space-y-20 px-4 pb-16 pt-6 sm:px-10">
        <nav aria-label="Browse by type" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {MEDIA_TYPES.map((t) => {
            const m = MEDIA_META[t];
            return (
              <Link
                key={t}
                href={`/marketplace?type=${t}`}
                className={`blob group relative flex h-24 items-center justify-between gap-3 overflow-hidden px-5 transition-transform duration-200 hover:rotate-0 hover:scale-[1.03] ${TYPE_TINT[t]}`}
              >
                <span className="display text-4xl sm:text-5xl">{m.label}</span>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-black/85 text-white transition-transform duration-200 group-hover:-rotate-12">
                  <m.icon className="size-5" strokeWidth={2.4} />
                </span>
              </Link>
            );
          })}
        </nav>

        {creators.items.length > 0 && (
          <Section title="Top creators" description="the brands fans follow most" icon={Crown} href="/creators">
            <CreatorStrip creators={creators.items} />
          </Section>
        )}

        {drops.items.length > 0 && (
          <Section title="Trending drops" description="straight from creators — minted the moment you buy" icon={Flame} href="/marketplace?kind=drops">
            <Rail>
              {drops.items.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </Rail>
          </Section>
        )}

        {resales.items.length > 0 && (
          <Section title="Fan resales" description="collected by fans, back on the market" icon={Repeat2} href="/marketplace?kind=resale">
            <Rail>
              {resales.items.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </Rail>
          </Section>
        )}

        <Section title="All items" description="every drop and resale, newest first" icon={LayoutGrid} href="/marketplace">
          <ListingGrid>
            {all.items.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </ListingGrid>
          {all.nextCursor && <LoadMoreListings input={{ kind: "all", limit: 24 }} cursor={all.nextCursor} />}
        </Section>
      </div>
    </>
  );
}
