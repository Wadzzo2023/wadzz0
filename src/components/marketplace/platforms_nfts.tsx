import React from "react";
import { api } from "~/utils/api";
import MarketAssetComponent from "./market_asset";
import { clsx } from "clsx";
import Asset from "../wallete/asset";

export default function WallateNFTs() {
  const assets = api.wallate.asset.getBancoinAssets.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (assets.isLoading)
    return (
      <MoreAssetsSkeleton className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" />
    );

  if (assets.data) {
    return (
      <div className="p-2">
        {assets.data.pages[0]?.assets.length === 0 && (
          <p className="w-full text-center">There is no curated asset yet</p>
        )}
        <div

          className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        >
          {assets.data?.pages.map((page, i) =>
            page.assets.map((item, j) => <Asset key={`asset-${i}-${j}`} asset={item} />)
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
      <MarketAssetSkeleton />
      <MarketAssetSkeleton />
    </div>
  );
}

function MarketAssetSkeleton() {
  return <div className="skeleton h-40 w-full"></div>;
}
