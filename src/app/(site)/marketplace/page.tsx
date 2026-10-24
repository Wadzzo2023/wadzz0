import { MediaType } from "@prisma/client";
import type { Metadata } from "next";

import { ListingCard, ListingGrid } from "~/components/market/listing-card";
import { LoadMoreListings } from "~/components/market/load-more";
import { MarketFilters } from "~/components/market/market-filters";
import { Store } from "lucide-react";
import type { ListingsInput } from "~/server/api/routers/market";
import { serverApi } from "~/server/api/server";
import { EmptyState } from "~/ui/empty-state";
import { PageBody, PageHeader } from "~/ui/page-header";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Buy digital items — art, music, video and 3D — from creators, or from other fans on the resale market.",
  alternates: { canonical: "/marketplace" },
};

const KINDS = ["all", "drops", "resale"] as const;
const SORTS = ["new", "price_asc", "price_desc"] as const;

function parse(sp: Record<string, string | string[] | undefined>): ListingsInput {
  const one = (k: string) => (typeof sp[k] === "string" ? sp[k] : undefined);
  const kind = KINDS.find((k) => k === one("kind")) ?? "all";
  const sort = SORTS.find((s) => s === one("sort")) ?? "new";
  const type = Object.values(MediaType).find((t) => t === one("type"));
  const q = one("q")?.trim().slice(0, 80) || undefined;
  return { kind, sort, mediaType: type, search: q, limit: 24 };
}

export default async function MarketplacePage({ searchParams }: PageProps<"/marketplace">) {
  const input = parse(await searchParams);
  const first = await (await serverApi()).market.listings(input);

  return (
    <PageBody wide className="space-y-8">
      <PageHeader eyebrow="Marketplace" title="Discover items" description="drops straight from creators — minted the moment you buy — and resales from other fans" />
      <MarketFilters current={input} />
      {first.items.length === 0 ? (
        <EmptyState icon={Store} title="Nothing here yet" description="Try another filter, or check back soon for new drops." />
      ) : (
        <>
          <ListingGrid>
            {first.items.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </ListingGrid>
          {first.nextCursor && <LoadMoreListings key={JSON.stringify(input)} input={input} cursor={first.nextCursor} />}
        </>
      )}
    </PageBody>
  );
}
