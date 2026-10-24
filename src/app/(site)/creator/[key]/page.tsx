import { TRPCError } from "@trpc/server";
import { BadgeCheck, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";

import { FollowButton, ShareButton } from "~/components/creator/creator-actions";
import { CreatorTabs } from "~/components/creator/creator-tabs";
import { Button } from "~/components/shadcn/ui/button";
import { env } from "~/env";
import { serverApi } from "~/server/api/server";
import { PageBody } from "~/ui/page-header";
import { Avatar } from "~/ui/person";

const getProfile = cache(async (key: string) => {
  try {
    return await (await serverApi()).creator.profile({ key: decodeURIComponent(key) });
  } catch (e) {
    if (e instanceof TRPCError && e.code === "NOT_FOUND") return null;
    throw e;
  }
});

export async function generateMetadata({ params }: PageProps<"/creator/[key]">): Promise<Metadata> {
  const p = await getProfile((await params).key);
  if (!p) return { title: "Creator not found", robots: { index: false } };
  const description = (p.bio ?? `${p.name} on Wadzzo — collect their drops and join their membership.`).slice(0, 180);
  const images = [p.coverUrl ?? p.profileUrl].filter((x): x is string => Boolean(x));
  return {
    title: p.name,
    description,
    alternates: { canonical: `/creator/${p.vanityURL ?? p.id}` },
    openGraph: { title: p.name, description, images, type: "profile" },
    twitter: { card: "summary_large_image", title: p.name, description, images },
  };
}

export default async function CreatorPage({ params }: PageProps<"/creator/[key]">) {
  const profile = await getProfile((await params).key);
  if (!profile) notFound();
  const api = await serverApi();
  const [listings, offers] = await Promise.all([
    api.market.listings({ kind: "all", creatorId: profile.id, limit: 24 }),
    api.market.pageTokenSales({ creatorId: profile.id, limit: 12 }),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: { "@type": "Organization", name: profile.name, description: profile.bio ?? undefined, image: profile.profileUrl ?? undefined, url: `${env.NEXT_PUBLIC_URL}/creator/${profile.vanityURL ?? profile.id}` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageBody wide className="space-y-8">
        {/* Cover in a chunky frame; the avatar breaks out of it */}
        <div className="relative">
          <div className="h-[28svh] min-h-[200px] max-h-[340px] overflow-hidden rounded-[1.8rem] border-[3px] border-foreground bg-surface-3">
            {profile.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.coverUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center bg-primary/20">
                <span className="display select-none text-[9rem] text-primary/25">{profile.name}</span>
              </div>
            )}
          </div>
          {profile.pageAsset && (
            <span className="marker absolute -top-3 right-6 rotate-6 rounded-lg bg-pink px-3 py-1 text-sm text-side-ink">${profile.pageAsset.code}</span>
          )}
        </div>

        <header className="flex flex-col gap-5 px-1 sm:flex-row sm:items-end">
          <span className="relative z-10 -mt-20 w-fit shrink-0 -rotate-3 self-start rounded-full bg-primary p-1 sm:-mt-24">
            <Avatar src={profile.profileUrl} name={profile.name} className="size-28 border-4 border-background text-4xl sm:size-40" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 space-y-2">
              <h1 className="display flex min-w-0 items-center gap-3 text-5xl sm:text-6xl lg:text-7xl">
                <span className="min-w-0 truncate">{profile.name}</span>
                <BadgeCheck className="size-8 shrink-0 text-primary" strokeWidth={2.6} aria-label="Verified creator" />
              </h1>
              <p className="marker -rotate-1 text-base text-primary">
                {profile.counts.followers.toLocaleString("en-US")} fan{profile.counts.followers === 1 ? "" : "s"} · joined{" "}
                {new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
              {profile.bio && <p className="max-w-2xl whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {profile.viewer.isSelf ? (
                <Button asChild variant="outline" className="rounded-full">
                  <a href={env.NEXT_PUBLIC_BRAND_PORTAL_URL} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" /> Manage brand
                  </a>
                </Button>
              ) : (
                <FollowButton creatorId={profile.id} initial={profile.viewer.following} />
              )}
              <ShareButton title={profile.name} />
            </div>
          </div>
        </header>

        <Suspense>
          <CreatorTabs profile={profile} listings={listings.items} nextCursor={listings.nextCursor} offers={offers} />
        </Suspense>
      </PageBody>
    </>
  );
}
