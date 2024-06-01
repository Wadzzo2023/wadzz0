import { api } from "~/utils/api";
import { MoreAssetsSkeleton } from "./platforms_nfts";
import MarketAssetComponent from "./market_asset";

export default function FanAssetNfts() {
  // first fetch from database and later validate
  const assets = api.marketplace.market.getFanMarketNfts.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (assets.isLoading) return <MoreAssetsSkeleton />;

  if (assets.data) {
    return (
      <>
        <div
          style={{
            scrollbarGutter: "stable",
          }}
          className="main-asset-area"
        >
          {assets.data.pages.map((page) =>
            page.nfts.map((item, i) => (
              <MarketAssetComponent key={i} item={item} />
            )),
          )}
        </div>
        <div className="mt-5">
          {assets.hasNextPage && (
            <button
              className="btn btn-outline btn-primary"
              onClick={() => void assets.fetchNextPage()}
            >
              Load More
            </button>
          )}
        </div>
      </>
    );
  }
}
