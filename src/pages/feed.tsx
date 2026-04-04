import Head from "next/head";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Globe, Lock, User } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "~/components/shadcn/ui/tabs";
import { Button } from "~/components/shadcn/ui/button";
import { PostCard } from "~/components/fan/creator/post";
import Loading from "~/components/wallete/loading";
import { getAssetBalanceFromBalance } from "~/lib/stellar/marketplace/test/acc";
import { cn } from "~/lib/utils";
import { env } from "~/env";
import { api } from "~/utils/api";

enum FeedTab {
  All = "all",
  Public = "public",
  Locked = "locked",
  Followed = "followed",
}

export default function FeedPage() {
  return (
    <>
      <Head>
        <title>News Feed | {env.NEXT_PUBLIC_SITE}</title>
        <meta
          name="description"
          content="Check out the latest stories and posts from creators."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <FeedContent />
      </main>
    </>
  );
}

function FeedContent() {
  const session = useSession();
  const [activeTab, setActiveTab] = useState<FeedTab>(FeedTab.All);
  const [isScrolled, setIsScrolled] = useState(false);

  const posts = api.fan.post.getAllRecentPosts.useInfiniteQuery(
    { limit: 5 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchOnWindowFocus: false,
    },
  );

  const accBalances = api.wallate.acc.getUserPubAssetBallances.useQuery(undefined, {
    enabled: !!session.data?.user?.id,
  });

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 140);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-5 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-4"
      >
        <h1 className="mb-1 text-3xl font-bold text-gray-900">News Feed</h1>
        <p className="text-sm text-gray-500">Check out the latest stories and posts</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className={cn(
          "sticky top-0 z-20 -mx-4 mb-4 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur-sm",
          "md:-mx-6 md:px-6",
        )}
      >
        <Tabs defaultValue={FeedTab.All} onValueChange={(value) => setActiveTab(value as FeedTab)}>
          <div className="overflow-x-auto scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="inline-flex h-auto min-w-full justify-start gap-2 bg-transparent p-0">
              <TabsTrigger value={FeedTab.All} className="shrink-0 rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 data-[state=active]:border-zinc-900 data-[state=active]:bg-zinc-900 data-[state=active]:text-white">
                All Posts
              </TabsTrigger>
              <TabsTrigger value={FeedTab.Public} className="flex shrink-0 items-center gap-1 rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 data-[state=active]:border-zinc-900 data-[state=active]:bg-zinc-900 data-[state=active]:text-white">
                <Globe className="h-3.5 w-3.5" /> Public
              </TabsTrigger>
              <TabsTrigger value={FeedTab.Locked} className="flex shrink-0 items-center gap-1 rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 data-[state=active]:border-zinc-900 data-[state=active]:bg-zinc-900 data-[state=active]:text-white">
                <Lock className="h-3.5 w-3.5" /> Locked
              </TabsTrigger>
              <TabsTrigger value={FeedTab.Followed} className="flex shrink-0 items-center gap-1 rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 data-[state=active]:border-zinc-900 data-[state=active]:bg-zinc-900 data-[state=active]:text-white">
                <User className="h-3.5 w-3.5" /> Followed
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </motion.div>

      <div className="mx-auto w-full max-w-2xl overflow-hidden border-x border-zinc-200 bg-white">
        {posts.isLoading ? (
          <Loading />
        ) : (
          <AnimatePresence initial={false} mode="sync">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2, type: "spring", stiffness: 100, damping: 15 }}
              className="space-y-0"
            >
              {posts.data?.pages.map((page, pageIndex) => (
                <div key={`page-${pageIndex}`}>
                  {page.posts
                    .filter((post) => {
                      if (activeTab === FeedTab.All) return true;
                      if (activeTab === FeedTab.Public) return !post.subscription;
                      if (activeTab === FeedTab.Locked) return !!post.subscription;
                      if (activeTab === FeedTab.Followed) {
                        const creatorWithFollowers = post.creator as { followers?: unknown };
                        return Array.isArray(creatorWithFollowers.followers) && creatorWithFollowers.followers.length > 0;
                      }
                      return true;
                    })
                    .map((post, index) => {
                      const locked = !!post.subscription;
                      let hasAccess = !locked;

                      if (locked && post.subscription) {
                        let pageAssetCode: string | undefined;
                        let pageAssetIssuer: string | undefined;

                        const customPageAsset = post.creator.customPageAssetCodeIssuer;
                        const pageAsset = post.creator.pageAsset;

                        if (pageAsset) {
                          pageAssetCode = pageAsset.code;
                          pageAssetIssuer = pageAsset.issuer;
                        } else if (customPageAsset) {
                          const [code, issuer] = customPageAsset.split("-");
                          pageAssetCode = code;
                          pageAssetIssuer = issuer;
                        }

                        const bal = getAssetBalanceFromBalance({
                          balances: accBalances.data,
                          code: pageAssetCode,
                          issuer: pageAssetIssuer,
                        });

                        hasAccess = post.subscription.price <= (bal || 0);
                      }

                      return (
                        <PostCard
                          key={post.id}
                          priority={1}
                          commentCount={post._count.comments}
                          creator={post.creator}
                          post={post}
                          likeCount={post._count.likes}
                          locked={locked}
                          show={hasAccess}
                          media={post.medias ?? []}
                          isFirst={pageIndex === 0 && index === 0}
                        />
                      );
                    })}
                </div>
              ))}

              {posts.data?.pages?.every((page) => page.posts.length === 0) ? (
                <p className="py-10 text-center text-sm text-muted-foreground">There are no posts yet</p>
              ) : null}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {posts.hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => void posts.fetchNextPage()}
            variant="outline"
            className="gap-2"
            disabled={posts.isFetching}
          >
            {posts.isFetching ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Load More
          </Button>
        </div>
      )}

      <AnimatePresence>
        {isScrolled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-4 md:bottom-28 md:right-6"
          >
            <Button
              size="icon"
              className="rounded-full shadow-lg"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <ChevronUp className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
