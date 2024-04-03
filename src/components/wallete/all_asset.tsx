import Loading from "./loading";
import Asset from "./asset";
import MyError from "./my_error";
import { api } from "~/utils/api";
import { useTagStore } from "~/lib/state/wallete/tag";
import WallateNFTs from "../marketplace/bandcoin_nfts";

export default function AllAsset() {
  const { selectedTag } = useTagStore();

  const assets = api.wallate.asset.getBancoinAssets.useInfiniteQuery(
    { limit: 10, tag: selectedTag },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (assets.isLoading) return <Loading />;
  if (assets.isError)
    return <MyError text="Error catch. Please reload this page." />;

  if (selectedTag == "bandcoin") {
    return <WallateNFTs />;
  } else {
    if (assets.data) {
      return (
        <div
          style={{
            scrollbarGutter: "stable",
          }}
          className="main-asset-area"
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
}
