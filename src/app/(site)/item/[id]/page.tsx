import { TRPCError } from "@trpc/server";
import { ChevronRight, ExternalLink, Lock, Repeat2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { creatorHref } from "~/lib/creator";
import { ItemActivity } from "~/components/market/item-activity";
import { BuyPanel } from "~/components/market/buy-panel";
import { ItemActions } from "~/components/market/item-actions";
import { ListingCard, ListingGrid } from "~/components/market/listing-card";
import { ItemMedia } from "~/components/media/item-media";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/shadcn/ui/accordion";
import { MEDIA_META } from "~/components/media/media-meta";
import { env } from "~/env";
import { formatTokenNumber, formatUsdAmount } from "~/lib/money";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { serverApi } from "~/server/api/server";
import { PageBody } from "~/ui/page-header";
import { Section } from "~/ui/section";
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

export default async function ItemPage({ params, searchParams }: PageProps<"/item/[id]">) {
  const item = await load(params);
  if (!item) notFound();

  // ?listing=<id> opens the page on one fan resale; otherwise it sells the creator's own listing.
  const wanted = Number((await searchParams).listing);
  const resale = Number.isInteger(wanted) ? (item.resales.find((r) => r.id === wanted) ?? null) : null;
  const listing = resale ?? item.original;
  const related = await (await serverApi()).market.related({ assetId: item.id });
  const resales = related.resales.filter((r) => r.id !== resale?.id);

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
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <PageBody wide className="space-y-10">
        <nav className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/marketplace" className="hover:text-foreground">
            Marketplace
          </Link>
          <ChevronRight className="size-3.5" />
          {item.creator && (
            <>
              <Link href={creatorHref(item.creator)} className="truncate hover:text-foreground">
                {item.creator.name}
              </Link>
              <ChevronRight className="size-3.5" />
            </>
          )}
          <span className="truncate text-foreground">{item.name}</span>
        </nav>

        {/* Poster banner: the art behind a dark fade, the details on it, the playable media as a framed sticker. */}
        <section className="relative isolate overflow-hidden rounded-[1.8rem] border-[3px] border-foreground bg-surface-3 text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.thumbnail} alt="" aria-hidden className="absolute inset-0 -z-10 size-full scale-110 object-cover opacity-60" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-black/95 via-black/80 to-black/40" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-12 lg:p-10">
            <div className="min-w-0 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
                  <meta.icon className="size-3.5" /> {meta.label}
                </span>
                {resale && (
                  <span className="marker inline-flex -rotate-2 items-center gap-1 rounded-md bg-pink px-2 py-0.5 text-xs text-side-ink">
                    <Repeat2 className="size-3.5" /> resale!
                  </span>
                )}
                {(item.privacy === "TIER" || item.privacy === "PRIVATE") && !resale && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-side-ink px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-side-mint">
                    <Lock className="size-3.5" /> {item.privacy === "TIER" ? `${item.tier?.name ?? "Tier"} members` : "Followers only"}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <p className="marker -rotate-2 text-base text-white/70">
                  *by{" "}
                  {item.creator ? (
                    <Link href={creatorHref(item.creator)} className="text-primary hover:underline">
                      {item.creator.name}
                    </Link>
                  ) : (
                    "Wadzzo"
                  )}
                  *
                </p>
                <h1 className="display break-words text-6xl sm:text-7xl xl:text-8xl">{item.name}</h1>
              </div>

              {/* price + stat stickers */}
              <div className="flex flex-wrap items-stretch gap-3">
                {listing && (
                  <div className="blob -rotate-2 bg-primary px-4 py-2 text-primary-foreground">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">{resale ? "Resale price" : "Price"}</p>
                    <p className="leading-none">
                      <span className="display text-5xl tabular-nums">{formatTokenNumber(listing.price)}</span> <span className="marker text-sm">{PLATFORM_ASSET.code}</span>
                    </p>
                    {listing.priceUSD != null && <p className="text-xs font-bold opacity-75">≈ {formatUsdAmount(listing.priceUSD)}</p>}
                  </div>
                )}
                <div className="blob rotate-1 bg-side-mint px-4 py-2 text-side-ink">
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Edition</p>
                  <p className="display text-4xl">{item.limit == null ? "Open" : item.limit.toLocaleString("en-US")}</p>
                  <p className="text-xs font-bold opacity-70">{item.mintedCount.toLocaleString("en-US")} minted</p>
                </div>
                {item.limit != null && (
                  <div className="blob -rotate-1 bg-pink px-4 py-2 text-side-ink">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Left</p>
                    <p className="display text-4xl">{left === 0 ? "Sold out" : left!.toLocaleString("en-US")}</p>
                    <p className="text-xs font-bold opacity-70">{Math.min(100, Math.round((item.mintedCount / item.limit) * 100))}% minted</p>
                  </div>
                )}
                <div className="blob rotate-2 bg-white/15 px-4 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Royalty</p>
                  <p className="display text-4xl">{item.royaltyPercent}%</p>
                  <p className="text-xs font-bold opacity-70">on every resale</p>
                </div>
              </div>
            </div>

            {/* the media itself */}
            <div className="relative mx-auto w-full max-w-[26rem]">
              <div className="overflow-hidden rounded-[1.4rem] border-[3px] border-white bg-surface shadow-[10px_12px_0_0_hsl(var(--primary))] lg:rotate-2">
                <ItemMedia assetId={item.id} name={item.name} thumbnail={item.thumbnail} mediaType={item.mediaType} className="rounded-none" />
              </div>
              <span className="marker pointer-events-none absolute -left-3 -top-3 -rotate-12 rounded-lg bg-pink px-2.5 py-1 text-sm text-side-ink">
                {resale ? "fan resale!" : left === 0 ? "sold out!" : left != null && left <= 10 ? `only ${left} left!` : `${meta.label.toLowerCase()} drop!`}
              </span>
            </div>
          </div>
        </section>

        {resale && (
          <div className="blob flex flex-wrap items-center justify-between gap-2 bg-pink px-4 py-3 text-side-ink">
            <span className="flex items-center gap-2 text-sm font-bold">
              <Repeat2 className="size-4" strokeWidth={2.6} /> Resale from {resale.placer?.name ?? "a fan"}
            </span>
            <Link href={`/item/${item.id}`} className="marker text-sm hover:underline">
              buy from the creator instead →
            </Link>
          </div>
        )}

        {/* Buy: full width */}
        <section className="space-y-3">
          <div className="rounded-[1.6rem] border-[3px] border-foreground bg-surface p-5 shadow-[8px_9px_0_0_hsl(var(--primary))] sm:p-7">
            <BuyPanel item={item} listing={listing} />
          </div>
          <ItemActions assetId={item.id} name={item.name} explorerUrl={expert} />
        </section>

        {/* Details (description, creator, token facts) and activity */}
        <Accordion type="multiple" defaultValue={["details"]} className="space-y-3">
          <AccordionItem value="details">
            <AccordionTrigger>Details</AccordionTrigger>
            <AccordionContent className="space-y-5">
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">{item.description?.trim() ? item.description : "No description yet."}</p>
              <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
                <dl className="divide-y-2 divide-dashed divide-foreground/10 rounded-[1.2rem] border-2 border-foreground/10 text-sm">
                  {[
                    ["Type", meta.label],
                    ["Token code", item.code],
                    ["Issuer", `${item.issuer.slice(0, 6)}…${item.issuer.slice(-6)}`],
                    ["Supply", item.limit == null ? "Unlimited" : item.limit.toLocaleString("en-US")],
                    ["Minted", item.mintedCount.toLocaleString("en-US")],
                    ["Creator royalty", `${item.royaltyPercent}% of every resale`],
                    ["Network", env.NEXT_PUBLIC_STELLAR_PUBNET ? "Stellar" : "Stellar testnet"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-3 px-4 py-3">
                      <dt className="font-semibold text-muted-foreground">{k}</dt>
                      <dd className="truncate font-mono text-[13px] font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="space-y-4">
                  {item.creator && (
                    <Link href={creatorHref(item.creator)} className="group flex items-center gap-3 rounded-[1.2rem] border-2 border-foreground/10 p-3 transition-colors hover:border-foreground">
                      <Avatar src={item.creator.profileUrl} name={item.creator.name} className="size-12" />
                      <span className="min-w-0 flex-1">
                        <span className="marker block text-xs text-muted-foreground">created by</span>
                        <span className="display block truncate text-2xl">{item.creator.name}</span>
                        {item.creator.bio && <span className="line-clamp-1 text-sm text-muted-foreground">{item.creator.bio}</span>}
                      </span>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:-rotate-45">
                        <ChevronRight className="size-5" strokeWidth={2.6} />
                      </span>
                    </Link>
                  )}
                  <a href={expert} target="_blank" rel="noreferrer" className="marker inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    view on stellar expert <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="activity">
            <AccordionTrigger>Activity</AccordionTrigger>
            <AccordionContent>
              <ItemActivity assetId={item.id} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="space-y-20 pt-6">
          {resales.length > 0 && (
            <Section title="Resale listings" description={`fans reselling ${item.name}, cheapest first`}>
              <ListingGrid>
                {resales.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </ListingGrid>
            </Section>
          )}
          {related.moreFromCreator.length > 0 && item.creator && (
            <Section title={`More from ${item.creator.name}`} description="same creator, more drops" href={creatorHref(item.creator)}>
              <ListingGrid>
                {related.moreFromCreator.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </ListingGrid>
            </Section>
          )}
          {related.similar.length > 0 && (
            <Section title={`More ${meta.label} items`} description="you might like these too" href={`/marketplace?type=${item.mediaType}`}>
              <ListingGrid>
                {related.similar.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </ListingGrid>
            </Section>
          )}
        </div>
      </PageBody>
    </>
  );
}
