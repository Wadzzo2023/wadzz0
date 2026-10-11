import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Lock, Newspaper, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { BountyCard } from "~/components/bounty/bounty-card";
import { CreatorCard } from "~/components/creator/creator-card";
import { ListingCard, ListingGrid } from "~/components/market/listing-card";
import { SearchField } from "~/components/search/search-field";
import { serverApi } from "~/server/api/server";
import { EmptyState } from "~/ui/empty-state";
import { PageBody } from "~/ui/page-header";

const queryOf = (sp: Record<string, string | string[] | undefined>) => (typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "");

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const q = queryOf(await searchParams);
  // result pages aren't indexed; the pages they point to are
  return { title: q ? `“${q}” — Search` : "Search", robots: { index: false, follow: true } };
}

/** One search across items, creators, bounties and posts, each section linking to its full list. */
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const q = queryOf(await searchParams);
  const api = await serverApi();
  const results =
    q.length >= 2
      ? await Promise.all([
          api.market.listings({ kind: "all", search: q, limit: 12 }),
          api.creator.list({ search: q, limit: 4 }),
          api.bounty.list({ filter: "open", search: q, limit: 4 }),
          api.post.feed({ scope: "all", search: q, limit: 6 }),
        ])
      : null;

  const [listings, creators, bounties, postResults] = results ?? [];
  const posts = postResults?.items ?? [];
  const total = (listings?.items.length ?? 0) + (creators?.items.length ?? 0) + (bounties?.items.length ?? 0) + posts.length;

  return (
    <PageBody wide className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="min-w-0 truncate font-hud text-2xl font-bold tracking-tight sm:text-3xl">{q ? <>Results for “{q}”</> : "Search"}</h1>
        <SearchField value={q} />
      </div>

      {!results ? (
        <EmptyState icon={Search} title="Search Wadzzo" description="Type at least 2 characters to find items, creators, posts and bounties." />
      ) : total === 0 ? (
        <EmptyState icon={Search} title={`Nothing found for “${q}”`} description="Try a shorter word, or a creator's name." />
      ) : (
        <>
          {listings && listings.items.length > 0 && (
            <Section title="Items" href={`/marketplace?q=${encodeURIComponent(q)}`}>
              <ListingGrid>
                {listings.items.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </ListingGrid>
            </Section>
          )}
          {creators && creators.items.length > 0 && (
            <Section title="Creators" href={`/creators?q=${encodeURIComponent(q)}`}>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {creators.items.map((c) => (
                  <CreatorCard key={c.id} creator={c} />
                ))}
              </div>
            </Section>
          )}
          {bounties && bounties.items.length > 0 && (
            <Section title="Bounties" href="/bounties">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {bounties.items.map((b) => (
                  <BountyCard key={b.id} bounty={b} />
                ))}
              </div>
            </Section>
          )}
          {posts.length > 0 && (
            <Section title="Posts" href="/feed">
              <ul className="glass divide-y divide-foreground/[0.06] overflow-hidden rounded-2xl">
                {posts.map((p) => {
                  const thumb = p.medias.find((m) => m.type === "IMAGE")?.url;
                  return (
                    <li key={p.id}>
                      <Link href={`/posts/${p.id}`} className="flex items-center gap-3 p-3 transition-colors hover:bg-foreground/[0.04]">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
                        ) : (
                          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{p.locked ? <Lock className="size-5" /> : <Newspaper className="size-5" />}</span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{p.heading}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {p.creator.name} · {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}
        </>
      )}
    </PageBody>
  );
}

function Section({ title, href, children }: { title: string; href: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-hud text-lg font-bold tracking-tight">{title}</h2>
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          See all <ArrowRight className="size-3.5" />
        </Link>
      </div>
      {children}
    </section>
  );
}
