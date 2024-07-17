import { api } from "~/utils/api";
import { MoreAssetsSkeleton } from "./platforms_nfts";
import MarketAssetComponent from "./market_asset";
import PageAssetComponent from "./page_asset";

export default function ArtistsPageTokens() {
  // first fetch from database and later validate
  const assets = api.marketplace.market.getPageAssets.useInfiniteQuery(
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
        {assets.data.pages[0]?.nfts.length === 0 && (
          <p className="w-full text-center">There is no page asset yet</p>
        )}
        <div
          style={{
            scrollbarGutter: "stable",
          }}
          className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5"
        >
          {assets.data.pages.map((page) =>
            page.nfts.map((item, i) => (
              <PageAssetComponent key={i} item={item} />
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
