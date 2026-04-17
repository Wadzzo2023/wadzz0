"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { getCookie } from "cookies-next";

import { Button } from "~/components/shadcn/ui/button";
import { ChevronDown } from "lucide-react";
import Loading from "~/components/wallete/loading";
import { getAssetBalanceFromBalance } from "~/lib/stellar/marketplace/test/acc";
import { api } from "~/utils/api";
import { LegacyPostCard } from "~/components/fan/creator/legacy-post";

const LAYOUT_MODE_COOKIE = "wadzzo-layout-mode";

export default function LegacyFeedPosts() {
  const session = useSession();

  const posts = api.fan.post.getAllRecentPosts.useInfiniteQuery(
    { limit: 5 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchOnWindowFocus: false,
    },
  );

  const accBalances = api.wallate.acc.getUserPubAssetBallances.useQuery(
    undefined,
    {
      enabled: !!session.data?.user?.id,
    },
  );

  if (posts.isLoading) return <Loading />;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {posts.data?.pages.map((page) => (
        <div key={page.nextCursor ?? "page"}>
          {page.posts.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-500">
              There are no posts yet
            </p>
          )}
          {page.posts.map((post) => (
            <LegacyPostCard
              priority={1}
              commentCount={post._count.comments}
              creator={post.creator}
              key={post.id}
              post={post}
              likeCount={post._count.likes}
              show={(() => {
                if (post.subscription) {
                  const bal = getAssetBalanceFromBalance({
                    balances: accBalances.data,
                    code: post.creator.pageAsset?.code,
                    issuer: post.creator.pageAsset?.issuer,
                  });
                  if (post.subscription.price <= bal) {
                    return true;
                  }
                  return false;
                }
                return true;
              })()}
              media={post.medias ? post.medias : []}
            />
          ))}
        </div>
      ))}

      {posts.hasNextPage && (
        <button onClick={() => void posts.fetchNextPage()} className="btn">
          {posts.isFetching && (
            <span className="loading loading-spinner"></span>
          )}
          See more
        </button>
      )}
    </div>
  );
}
