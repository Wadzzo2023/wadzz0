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
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {/* Cover, full width like the other page banners */}
      <div className="relative h-[34svh] min-h-[220px] max-h-[380px] overflow-hidden bg-black">
        {profile.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.coverUrl} alt="" className="size-full object-cover" />
        ) : profile.profileUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.profileUrl} alt="" className="size-full scale-125 object-cover opacity-60 blur-3xl" />
        ) : (
          <div className="size-full bg-[radial-gradient(circle_at_20%_30%,hsl(var(--primary)/0.45),transparent_55%),radial-gradient(circle_at_80%_70%,hsl(190_90%_50%/0.3),transparent_55%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-background" />
      </div>

      <PageBody wide className="relative space-y-6 pt-0">
        {/* Avatar overlaps the cover; name, bio and actions sit beside it */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <span className="-mt-14 w-fit shrink-0 rounded-full bg-gradient-to-tr from-primary via-green-hot to-cyan-400 p-[3px] shadow-[0_0_40px_-8px_hsl(var(--primary)/0.8)] sm:-mt-20">
            <Avatar src={profile.profileUrl} name={profile.name} className="size-24 border-4 border-background text-3xl sm:size-36" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-1">
              <h1 className="flex items-center gap-2 font-hud text-3xl font-bold tracking-tight sm:text-4xl">
                <span className="truncate">{profile.name}</span>
                <BadgeCheck className="size-6 shrink-0 text-primary" aria-label="Verified creator" />
              </h1>
              {profile.bio && <p className="max-w-2xl whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>}
              <p className="text-xs text-muted-foreground">
                {profile.counts.followers.toLocaleString("en-US")} follower{profile.counts.followers === 1 ? "" : "s"} · Joined{" "}
                {new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {profile.viewer.isSelf ? (
                <Button asChild variant="outline" className="glass rounded-full">
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
    </div>
  );
}
