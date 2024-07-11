import React from "react";
import { api } from "~/utils/api";
import MarketAssetComponent from "./market_asset";
import { clsx } from "clsx";

export default function WallateNFTs() {
  const assets = api.marketplace.market.getMarketAdminNfts.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (assets.isLoading)
    return (
      <MoreAssetsSkeleton className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5" />
    );

  if (assets.data) {
    return (

      <div className="p-2">
      <div
        style={{
          scrollbarGutter: "stable",
        }}
        className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5"
      >
        {assets.data.pages.map((page) =>
          page.nfts.map((item, i) => (
            <MarketAssetComponent key={i} item={item} />
          )),
        )}
        </div>
        {assets.hasNextPage && (
          <button
            className="btn btn-outline btn-primary"
            onClick={() => void assets.fetchNextPage()}
          >
            Load More
          </button>
        )}
      </div>
    );
  }
}

interface skeletonProps {
  className?: string;
}
export function MoreAssetsSkeleton({ className }: skeletonProps) {
  return (
    <div
      style={{
        scrollbarGutter: "stable",
      }}
      className={clsx("main-asset-area", className)}
    >
      <MarketAssetSkeleton />
      <MarketAssetSkeleton />
      <MarketAssetSkeleton />
      <MarketAssetSkeleton />
    </div>
  );
}

function MarketAssetSkeleton() {
  return <div className="skeleton h-40 w-full"></div>;
}
