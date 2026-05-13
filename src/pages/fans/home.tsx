import Head from "next/head";
import { useState } from "react";
import { getCookie } from "cookies-next";
import { PostCard } from "~/components/fan/creator/post";

import { useSession } from "next-auth/react";
import Loading from "~/components/wallete/loading";
import { getAssetBalanceFromBalance } from "~/lib/stellar/marketplace/test/acc";
import { api } from "~/utils/api";
import { env } from "~/env";
import TrendingSidebar, { FollowedSidebar } from "~/components/fan/nav/fans-home-sidebar";
import { Card, CardContent, CardHeader } from "~/components/shadcn/ui/card";

export default function Home() {
  const [layoutMode] = useState<"modern" | "legacy">(() => {
    const cookieMode = getCookie("wadzzo-layout-mode");
    if (cookieMode === "modern") {
      return "modern";
    }
    if (cookieMode === "legacy") {
      return "legacy";
    }
    if (typeof window !== "undefined") {
      const storedMode = localStorage.getItem("layoutMode");
      if (storedMode === "modern") {
        return "modern";
      }
      if (storedMode === "legacy") {
        return "legacy";
      }
    }
    return "legacy";
  });

  return (
    <>
      <Head>
        <title>Creators | {env.NEXT_PUBLIC_SITE}</title>
        <meta
          name="description"
          content="A subscription-based platform that connects creators with their fans on Stellar Blockchain."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen">
        <div className="flex w-full">
          <AuthShowcase layoutMode={layoutMode} />
          {layoutMode === "modern" && (
            <div className="hidden w-80 flex-col gap-4 p-4 lg:flex">
              <Card>
                <CardHeader className="border-b p-3">
                  <h3 className="text-center text-sm font-medium">Trending Creators</h3>
                </CardHeader>
                <CardContent className="p-2">
                  <TrendingSidebar />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="border-b p-3">
                  <h3 className="text-center text-sm font-medium">Followed Creators</h3>
                </CardHeader>
                <CardContent className="p-2">
                  <FollowedSidebar />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function AuthShowcase({ layoutMode }: { layoutMode: "modern" | "legacy" }) {
  const { data, status } = useSession();

  return (
    <div className="w-full">
      <h1 className={layoutMode === "modern" ? "flex items-center justify-center rounded-md bg-base-100 py-3 text-center text-2xl font-bold" : "flex items-center justify-center rounded-md bg-base-100 py-3 text-center text-2xl font-bold shadow-md"}>
        News Feed
      </h1>
      {/* <div className="flex flex-col items-center">
        <CreatorSecret />
      </div> */}
      <div className="mt-2 flex w-full flex-col items-center ">
        <AllRecentPost />
      </div>
    </div>
  );
}

function AllRecentPost() {
  const posts = api.fan.post.getAllRecentPosts.useInfiniteQuery(
    {
      limit: 5,
    },
    {
      getNextPageParam: (lastPage) => {
        return lastPage.nextCursor;
      },

      refetchOnWindowFocus: false,
    },
  );

  const handleFetchNextPage = () => {
    void posts.fetchNextPage();
  };

  const accBalances = api.wallate.acc.getUserPubAssetBallances.useQuery();

  // if (isLoading2) return <div>Loading to fetch membership...</div>;

  if (posts.isLoading) return <Loading />;
  // return (
  //   <div className="flex flex-col gap-4">
  //     <PostSkeleton />
  //     <PostSkeleton />
  //   </div>
  // );

  if (posts.data) {
    return (
      <div className="flex w-full flex-col items-center gap-4 bg-white p-2 md:container md:mx-auto">
        {posts.data.pages.map((page, pageIndex) => (
          <div key={page.posts[0]?.id} className="w-full">
            {page.posts.length === 0 && <p>There are no post yet</p>}
            {page.posts.map((post, index) => (
              <div key={post.id} className="w-full">
                <PostCard
                  isFirst={pageIndex === 0 && index === 0}
                  priority={1}
                  commentCount={post._count.comments}
                  creator={post.creator}
                  key={post.id}
                  post={post}
                  likeCount={post._count.likes}
                locked={post.subscription ? true : false}
                show={(() => {
                  if (post.subscription) {
                    let pageAssetCode: string | undefined;
                    let pageAssetIssuer: string | undefined;

                    const customPageAsset =
                      post.creator.customPageAssetCodeIssuer;
                    const pageAsset = post.creator.pageAsset;

                    if (pageAsset) {
                      pageAssetCode = pageAsset.code;
                      pageAssetIssuer = pageAsset.issuer;
                    } else {
                      if (customPageAsset) {
                        const [code, issuer] = customPageAsset.split("-");
                        pageAssetCode = code;
                        pageAssetIssuer = issuer;
                      }
                    }
                    const bal = getAssetBalanceFromBalance({
                      balances: accBalances.data,
                      code: pageAssetCode,
                      issuer: pageAssetIssuer,
                    });
                    if (post.subscription.price <= bal) {
                      return true;
                    }

                    return false;
                  } else return true;
                })()}
media={post.medias ? post.medias : []}
              />
              </div>
            ))}
          </div>
        ))}

        {posts.hasNextPage && (
          <button onClick={handleFetchNextPage} className="btn">
            {posts.isFetching && (
              <span className="loading loading-spinner"></span>
            )}
            See more
          </button>
        )}
      </div>
    );
  }
}

export function PostSkeleton() {
  return (
    <div className="flex w-64 flex-col gap-4">
      <div className="skeleton h-32 w-full"></div>
      <div className="skeleton h-4 w-28"></div>
      <div className="skeleton h-4 w-full"></div>
      <div className="skeleton h-4 w-full"></div>
    </div>
  );
}

// function CreatorSecret() {

//   console.log(email, uid);

//   const secret = api.fan.creator.getCreatorSecret.useQuery({ email, uid });
//   if (secret.isLoading) return <div>Loading...</div>;
//   if (secret.data) return <div>{secret.data}</div>;
//   if (secret.error) return <div>{secret.error.message}</div>;
// }
