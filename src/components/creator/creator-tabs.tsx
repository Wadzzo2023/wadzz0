"use client";

import { Check, Coins, Copy, Crown, Pencil, Images, Newspaper, Target } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import { BountyCard, BountyCardSkeleton } from "~/components/bounty/bounty-card";
import { ListingCard, ListingGrid } from "~/components/market/listing-card";
import { LoadMoreListings } from "~/components/market/load-more";
import { PostCard } from "~/components/post/post-card";
import { Button } from "~/components/shadcn/ui/button";
import { env } from "~/env";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { cn } from "~/lib/utils";
import type { ListingCard as ListingCardData } from "~/server/api/routers/market";
import { EmptyState } from "~/ui/empty-state";
import { Skeleton } from "~/ui/skeleton";
import { api, type RouterOutputs } from "~/utils/api";

import { MembershipSection } from "./creator-actions";
import { tierColor } from "./tier-card";

type Profile = RouterOutputs["creator"]["profile"];
type Offer = RouterOutputs["market"]["pageTokenSales"][number];

const portal = env.NEXT_PUBLIC_BRAND_PORTAL_URL.replace(/\/$/, "");

const TABS = ["items", "posts", "bounties", "membership"] as const;
type Tab = (typeof TABS)[number];
const isTab = (v: string | null | undefined): v is Tab => TABS.includes(v as Tab);

/**
 * A creator's page body: tabs (with counts) for items, posts, bounties and
 * membership; the Posts tab carries the About / membership / page token /
 * page link sidebar. The open tab lives in ?tab= so it
 * can be shared.
 */
export function CreatorTabs({ profile, listings, nextCursor, offers }: { profile: Profile; listings: ListingCardData[]; nextCursor: number | null; offers: Offer[] }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const params = useSearchParams();
  const param = params?.get("tab");
  const tab: Tab = isTab(param) ? param : "items";
  const setTab = (t: Tab) => router.replace(t === "items" ? pathname : `${pathname}?tab=${t}`, { scroll: false });

  const c = profile.counts;
  const tabs: { id: Tab; label: string; icon: typeof Images; count?: number }[] = [
    { id: "items", label: "Items", icon: Images, count: c.items },
    { id: "posts", label: "Posts", icon: Newspaper, count: c.posts },
    { id: "bounties", label: "Bounties", icon: Target, count: c.bounties },
    { id: "membership", label: "Membership", icon: Crown, count: profile.subscriptions.length || undefined },
  ];

  return (
    <div className="space-y-6">
      <div className="glass flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl p-1" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors",
              tab === t.id ? "bg-primary text-primary-foreground shadow-[0_0_20px_-6px_hsl(var(--primary)/0.8)]" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="size-4" /> {t.label}
            {t.count != null && <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", tab === t.id ? "bg-black/15" : "bg-foreground/10")}>{t.count}</span>}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "items" &&
          (listings.length === 0 ? (
            <EmptyState icon={Images} title="No items yet" description={`${profile.name} hasn't listed anything yet.`} />
          ) : (
            <div className="space-y-4">
              <ListingGrid>
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </ListingGrid>
              {nextCursor && <LoadMoreListings input={{ kind: "all", creatorId: profile.id, limit: 24 }} cursor={nextCursor} />}
            </div>
          ))}
        {tab === "posts" && <CreatorPosts profile={profile} onMembership={() => setTab("membership")} />}
        {tab === "bounties" && <CreatorBounties creatorId={profile.id} name={profile.name} />}
        {tab === "membership" && <MembershipSection profile={profile} offers={offers} />}
      </div>
    </div>
  );
}

/** The brand's page token as a poster: its image fills the card and the details sit on top. */
function PageTokenCard({ profile, onMembership }: { profile: Profile; onMembership: () => void }) {
  const page = profile.pageAsset;
  if (!page) return null;
  const v = profile.viewer;
  const tier = profile.subscriptions.find((t) => t.id === v.tierId);
  const action = "inline-flex h-8 items-center rounded-lg bg-white/15 px-3 text-xs font-semibold ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-white/25";

  return (
    <section className="relative isolate flex min-h-44 flex-col justify-between overflow-hidden rounded-2xl bg-black p-4 text-white ring-1 ring-foreground/10">
      {page.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={page.thumbnail} alt="" className="absolute inset-0 -z-10 size-full object-cover" />
      ) : (
        <div className="absolute inset-0 -z-10 flex items-center justify-center bg-[radial-gradient(circle_at_25%_20%,hsl(var(--primary)/0.55),transparent_60%),radial-gradient(circle_at_80%_75%,hsl(190_90%_45%/0.45),transparent_60%)]">
          <Coins className="size-16 text-white/20" />
        </div>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-black/30 to-black/85" />

      <p className="w-fit rounded-full bg-black/45 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-white/15 backdrop-blur-md">Page token</p>

      <div className="space-y-2">
        <p className="font-hud text-2xl font-bold leading-tight text-[hsl(112_85%_62%)] drop-shadow-[0_0_12px_hsl(112_85%_55%/0.5)]">{page.code}</p>
        <div className="flex items-end justify-between gap-3">
          <p className="min-w-0 text-xs text-white/75">
            {v.isSelf ? (
              "Fans hold this to unlock your tiers."
            ) : v.signedIn ? (
              <>
                You hold <b className="tabular-nums text-white">{v.pageTokens.toLocaleString("en-US")}</b>
                {tier && <> · {tier.name} member</>}
              </>
            ) : (
              `Hold ${page.code} to unlock members-only posts and items.`
            )}
          </p>
          {v.isSelf ? (
            <a href={`${portal}/settings?tab=page-asset`} target="_blank" rel="noreferrer" className={action}>
              Manage
            </a>
          ) : (
            <button type="button" onClick={onMembership} className={action}>
              Get {page.code}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function PageLinkCard({ profile }: { profile: Profile }) {
  // brands with a vanity name get the short link (wadzzo.com/name redirects to their page)
  const path = profile.vanityURL ? `/${profile.vanityURL}` : `/creator/${profile.id}`;
  const copy = () => {
    void navigator.clipboard.writeText(`${env.NEXT_PUBLIC_URL.replace(/\/$/, "")}${path}`).then(
      () => toast.success("Link copied"),
      () => toast.error("Couldn't copy the link"),
    );
  };
  return (
    <div className="glass flex items-center gap-3 rounded-2xl p-3">
      <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Copy className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Page link</p>
        <p className="truncate text-sm">
          {env.NEXT_PUBLIC_URL.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          {path}
        </p>
      </div>
      <Button variant="ghost" size="sm" className="rounded-lg" onClick={copy}>
        Copy
      </Button>
    </div>
  );
}

/** The brand's posts, laid out like the Feed: posts on the left, About and membership tiers in a sticky sidebar. */
function CreatorPosts({ profile, onMembership }: { profile: Profile; onMembership: () => void }) {
  const q = api.post.feed.useInfiniteQuery({ creatorId: profile.id, limit: 10 }, { getNextPageParam: (p) => p.nextCursor });
  const posts = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-4">
        {q.isLoading ? (
          [0, 1].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)
        ) : !posts.length ? (
          <EmptyState icon={Newspaper} title="No posts yet" description={`${profile.name} hasn't posted yet.`} />
        ) : (
          <>
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
            {q.hasNextPage && (
              <div className="flex justify-center">
                <Button variant="outline" className="rounded-xl" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
                  {q.isFetchingNextPage ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <section className="glass space-y-2 rounded-2xl p-4">
          <h2 className="font-hud font-bold">About</h2>
          <p className="whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">{profile.bio?.trim() ? profile.bio : "No bio yet."}</p>
          <p className="text-xs text-muted-foreground">
            {profile.counts.followers.toLocaleString("en-US")} follower{profile.counts.followers === 1 ? "" : "s"} · {profile.counts.posts.toLocaleString("en-US")} post
            {profile.counts.posts === 1 ? "" : "s"}
          </p>
        </section>

        {profile.subscriptions.length > 0 && (
          <section className="glass space-y-3 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-hud font-bold">Membership</h2>
              {profile.pageAsset && <span className="text-xs font-semibold text-primary">{profile.pageAsset.code}</span>}
            </div>
            <ul className="space-y-1.5">
              {profile.subscriptions.map((t) => {
                const current = profile.viewer.tierId === t.id;
                return (
                  <li key={t.id} className={cn("flex items-center gap-3 rounded-xl p-2.5 ring-1 ring-foreground/[0.06]", current ? "bg-primary/10 ring-primary/30" : "bg-foreground/[0.03]")}>
                    <span className={cn("h-8 w-1 shrink-0 rounded-full", tierColor(t.color).bar)} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        <span className="truncate">{t.name}</span>
                        {current && <Check className="size-3.5 shrink-0 text-primary" />}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Hold {t.price.toLocaleString("en-US")} {profile.pageAsset?.code ?? "tokens"}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <MembershipAction profile={profile} onMembership={onMembership} />
          </section>
        )}

        <PageTokenCard profile={profile} onMembership={onMembership} />
        <PageLinkCard profile={profile} />
      </aside>
    </div>
  );
}

/**
 * The membership call to action, by who's looking: the brand edits its tiers
 * in the portal, a member sees their tier, a fan joins, and a signed-out
 * visitor signs in first.
 */
function MembershipAction({ profile, onMembership }: { profile: Profile; onMembership: () => void }) {
  const { openSignIn } = useRequireAuth();
  const v = profile.viewer;
  const tier = profile.subscriptions.find((t) => t.id === v.tierId);

  if (v.isSelf) {
    return (
      <Button asChild variant="outline" className="w-full rounded-xl">
        <a href={`${portal}/membership`} target="_blank" rel="noreferrer">
          <Pencil className="size-4" /> Edit tiers
        </a>
      </Button>
    );
  }
  if (!v.signedIn) {
    return (
      <Button className="w-full rounded-xl" onClick={openSignIn}>
        <Crown className="size-4" /> Sign in to join
      </Button>
    );
  }
  if (tier) {
    return (
      <Button variant="outline" className="w-full rounded-xl" onClick={onMembership}>
        <Check className="size-4 text-primary" /> {tier.name} member · View
      </Button>
    );
  }
  return (
    <Button className="w-full rounded-xl" onClick={onMembership}>
      <Crown className="size-4" /> Join membership
    </Button>
  );
}

function CreatorBounties({ creatorId, name }: { creatorId: string; name: string }) {
  const q = api.bounty.list.useInfiniteQuery({ filter: "open", creatorId, limit: 10 }, { getNextPageParam: (p) => p.nextCursor });
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  const grid = "grid grid-cols-1 gap-4 lg:grid-cols-2";
  if (q.isLoading) {
    return (
      <div className={grid}>
        {[0, 1].map((i) => (
          <BountyCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (!items.length) return <EmptyState icon={Target} title="No open bounties" description={`${name} has no open bounties right now.`} />;
  return (
    <div className="space-y-4">
      <div className={grid}>
        {items.map((b) => (
          <BountyCard key={b.id} bounty={b} />
        ))}
      </div>
      {q.hasNextPage && (
        <div className="flex justify-center">
          <Button variant="outline" className="rounded-xl" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
            {q.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
