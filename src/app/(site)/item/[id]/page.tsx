import { TRPCError } from "@trpc/server";
import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { creatorHref } from "~/components/creator/creator-card";
import { ItemActivity } from "~/components/market/item-activity";
import { BuyPanel } from "~/components/market/buy-panel";
import { ItemMedia } from "~/components/media/item-media";
import { MEDIA_META } from "~/components/media/media-meta";
import { env } from "~/env";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { serverApi } from "~/server/api/server";
import { PageBody } from "~/ui/page-header";
import { Avatar } from "~/ui/person";

const getItem = cache(async (id: number) => {
  try {
    return await (await serverApi()).market.item({ assetId: id });
  } catch (e) {
    if (e instanceof TRPCError && e.code === "NOT_FOUND") return null;
    throw e;
  }
});

async function load(params: Promise<{ id: string }>) {
  const id = Number((await params).id);
  return Number.isInteger(id) ? getItem(id) : null;
}

export async function generateMetadata({ params }: PageProps<"/item/[id]">): Promise<Metadata> {
  const item = await load(params);
  if (!item) return { title: "Item not found", robots: { index: false } };
  const description = (item.description ?? `${MEDIA_META[item.mediaType].label} by ${item.creator?.name ?? "Wadzzo"}`).slice(0, 180);
  return {
    title: `${item.name} by ${item.creator?.name ?? "Wadzzo"}`,
    description,
    alternates: { canonical: `/item/${item.id}` },
    openGraph: { title: item.name, description, images: [{ url: item.thumbnail, alt: item.name }], type: "website" },
    twitter: { card: "summary_large_image", title: item.name, description, images: [item.thumbnail] },
  };
}

export default async function ItemPage({ params }: PageProps<"/item/[id]">) {
  const item = await load(params);
  if (!item) notFound();

  const meta = MEDIA_META[item.mediaType];
  const lowest = [item.original, ...item.resales].filter(Boolean).sort((a, b) => a!.price - b!.price)[0];
  const left = item.limit == null ? null : Math.max(0, item.limit - item.mintedCount);
  const expert = `https://stellar.expert/explorer/${env.NEXT_PUBLIC_STELLAR_PUBNET ? "public" : "testnet"}/asset/${item.code}-${item.issuer}`;

  // Structured data so search engines can show the item with its price.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    image: item.thumbnail,
    description: item.description ?? undefined,
    brand: item.creator ? { "@type": "Brand", name: item.creator.name } : undefined,
    offers: lowest
      ? { "@type": "Offer", price: lowest.priceUSD.toFixed(2), priceCurrency: "USD", availability: left === 0 && !item.resales.length ? "https://schema.org/SoldOut" : "https://schema.org/InStock", url: `${env.NEXT_PUBLIC_URL}/item/${item.id}` }
      : undefined,
  };

  return (
    <PageBody wide>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/marketplace" className="hover:text-foreground">
          Marketplace
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{item.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        {/* Left: the media stays in view while the details scroll. */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ItemMedia assetId={item.id} name={item.name} thumbnail={item.thumbnail} mediaType={item.mediaType} className="mx-auto w-full max-w-[min(100%,calc(100dvh-12rem))]" />
        </div>

        {/* Right: everything about the item. */}
        <div className="min-w-0 space-y-6">
          <header className="space-y-2">
            <ItemHeading item={item} metaLabel={meta.label} />
          </header>

          <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
            <BuyPanel item={item} />
            <p className="mt-4 border-t pt-3 text-center text-xs text-muted-foreground">Prices in {PLATFORM_ASSET.code}. Every cost is shown before you sign.</p>
          </div>

          {item.description && (
            <section className="space-y-2">
              <h2 className="font-hud text-lg font-bold">About this item</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </section>
          )}

          <section className="space-y-2">
            <h2 className="font-hud text-lg font-bold">Details</h2>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border text-sm">
              {[
                ["Type", meta.label],
                ["Supply", item.limit == null ? "Unlimited" : item.limit.toLocaleString()],
                ["Minted", item.mintedCount.toLocaleString()],
                ["Creator royalty", `${item.royaltyPercent}%`],
                ["Token", item.code],
              ].map(([k, v]) => (
                <div key={k} className="bg-card p-3">
                  <dt className="label-caps">{k}</dt>
                  <dd className="mt-1 truncate font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <a href={expert} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              View {item.code} on Stellar <ExternalLink className="size-3" />
            </a>
          </section>

          {item.creator && (
            <section className="space-y-2">
              <h2 className="font-hud text-lg font-bold">Creator</h2>
              <Link href={creatorHref(item.creator)} className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-line-bright">
                <Avatar src={item.creator.profileUrl} name={item.creator.name} className="size-11" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{item.creator.name}</span>
                  {item.creator.bio && <span className="line-clamp-2 text-sm text-muted-foreground">{item.creator.bio}</span>}
                </span>
              </Link>
            </section>
          )}

          <ItemActivity assetId={item.id} />
        </div>
      </div>
    </PageBody>
  );
}

function ItemHeading({ item, metaLabel }: { item: NonNullable<Awaited<ReturnType<typeof getItem>>>; metaLabel: string }) {
  return (
    <>
      <p className="label-caps text-primary">{metaLabel}</p>
      <h1 className="font-hud text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{item.name}</h1>
      {item.creator && (
        <Link href={creatorHref(item.creator)} className="inline-flex items-center gap-2 text-sm hover:underline">
          <Avatar src={item.creator.profileUrl} name={item.creator.name} className="size-6 text-[10px]" />
          {item.creator.name}
        </Link>
      )}
    </>
  );
}
