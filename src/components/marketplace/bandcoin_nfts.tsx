import React from "react";
import { api } from "~/utils/api";
import AllAsset from "../wallete/all_asset";
import MarketAssetComponent from "./market_asset";

export default function WallateNFTs() {
  const assets = api.marketplace.market.getMarketAdminNft.useInfiniteQuery(
    { limit: 4 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const toggleVisibility =
    api.marketplace.market.toggleVisibilityMarketNft.useMutation();

  if (assets.isLoading) return <span className="loading loading-spinner" />;

  if (assets.data) {
    return (
      <div
        style={{
          scrollbarGutter: "stable",
        }}
        className="main-asset-area"
      >
        {assets.data.pages.map((page) =>
          page.nfts.map((item, i) => (
            <MarketAssetComponent key={i} item={item.asset} />
          )),
        )}
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
