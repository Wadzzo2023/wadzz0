import { TRPCError } from "@trpc/server";
import { BadgeCheck } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { FollowButton, ShareButton } from "~/components/creator/creator-actions";
import { CreatorTabs } from "~/components/creator/creator-tabs";
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
      {/* Cover */}
      <div className="relative h-44 overflow-hidden sm:h-64">
        {profile.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.coverUrl} alt="" className="size-full object-cover" />
        ) : profile.profileUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.profileUrl} alt="" className="size-full scale-125 object-cover opacity-60 blur-3xl" />
        ) : (
          <div className="size-full bg-gradient-to-br from-primary/40 via-cyan-500/20 to-purple-500/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
      </div>

      <PageBody wide className="relative -mt-16 space-y-8 pt-0 sm:-mt-20">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
            <span className="w-fit rounded-full bg-gradient-to-tr from-primary via-green-hot to-cyan-400 p-[3px] shadow-[0_0_40px_-8px_hsl(var(--primary)/0.8)]">
              <Avatar src={profile.profileUrl} name={profile.name} className="size-24 border-4 border-background text-3xl sm:size-32" />
            </span>
            <div className="min-w-0 space-y-1.5 pb-1">
              <h1 className="flex items-center gap-2 font-hud text-3xl font-bold tracking-tight sm:text-4xl">
                <span className="truncate">{profile.name}</span>
                <BadgeCheck className="size-6 shrink-0 text-primary" aria-label="Verified creator" />
              </h1>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="glass rounded-full px-3 py-1">
                  <b className="font-hud tabular-nums">{profile._count.followers.toLocaleString("en-US")}</b> <span className="text-muted-foreground">followers</span>
                </span>
                <span className="glass rounded-full px-3 py-1">
                  <b className="font-hud tabular-nums">{profile._count.posts.toLocaleString("en-US")}</b> <span className="text-muted-foreground">posts</span>
                </span>
                {profile.pageAsset && (
                  <span className="glass rounded-full px-3 py-1">
                    <span className="text-muted-foreground">Token</span> <b className="font-hud text-primary">{profile.pageAsset.code}</b>
                  </span>
                )}
              </div>
            </div>
          </div>
          {!profile.viewer.isSelf && (
            <div className="flex items-center gap-2">
              <FollowButton creatorId={profile.id} initial={profile.viewer.following} />
              <ShareButton title={profile.name} />
            </div>
          )}
        </header>

        {profile.bio && <p className="max-w-3xl whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">{profile.bio}</p>}

        <CreatorTabs profile={profile} listings={listings.items} nextCursor={listings.nextCursor} offers={offers} />
      </PageBody>
    </div>
  );
}
