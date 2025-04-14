import Loading from "./loading";
import Asset from "./asset";
import MyError from "./my_error";
import { api } from "~/utils/api";
import { MoreAssetsSkeleton } from "../marketplace/platforms_nfts";

export default function OtherAssets() {
  const assets = api.wallate.asset.getBancoinAssets.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (assets.isLoading)
    return (
      <MoreAssetsSkeleton className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5" />
    );
  if (assets.isError)
    return <MyError text="Error catch. Please reload this page." />;

  if (assets.data) {
    return (
      <div
        style={{
          scrollbarGutter: "stable",
        }}
        className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5"
      >
        {assets.data.pages.map((page) =>
          page.assets.map((item, i) => <Asset key={i} asset={item} />),
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
