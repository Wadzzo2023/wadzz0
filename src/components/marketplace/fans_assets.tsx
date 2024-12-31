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

  if (assets.isLoading)
    return (
      <MoreAssetsSkeleton className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" />
    );

  if (assets.data) {
    return (
      <div className="p-2">
        {assets.data.pages[0]?.nfts.length === 0 && (
          <p className="w-full text-center">There is no market asset yet</p>
        )}
        <div
          style={{
            scrollbarGutter: "stable",
          }}
          className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
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
      </div>
    );
  }
}
