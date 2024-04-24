import Loading from "./loading";
import Asset from "./asset";
import MyError from "./my_error";
import { api } from "~/utils/api";
import { useTagStore } from "~/lib/state/wallete/tag";
import MarketAssetComponent from "../marketplace/market_asset";

export default function AllAsset() {
  const assets = api.wallate.asset.getBancoinAssets.useInfiniteQuery(
    { limit: 4 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const musicAssets = api.music.song.getAllSongMarketAssets.useInfiniteQuery(
    { limit: 4 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const adminAssets =
    api.marketplace.market.getMarketAdminNfts.useInfiniteQuery(
      { limit: 4 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  if (assets.isLoading && musicAssets.isLoading && adminAssets.isLoading)
    return <Loading />;

  // if (assets.isError)
  //   return <MyError text="Error catch. Please reload this page." />;

  return (
    <div
      style={{
        scrollbarGutter: "stable",
      }}
      className="main-asset-area"
    >
      {assets.data?.pages.map((page) =>
        page.assets.map((item, i) => <Asset key={i} asset={item} />),
      )}
      {musicAssets.data?.pages.map((page) => {
        return page.nfts.map((item, id) => (
          <MarketAssetComponent key={id} item={item} />
        ));
      })}
      {adminAssets.data?.pages.map((page) =>
        page.nfts.map((item, i) => (
          <MarketAssetComponent key={i} item={item} />
        )),
      )}
      <LoadMore />
    </div>
  );

  function LoadMore() {
    function loadMore() {
      if (assets.hasNextPage) void assets.fetchNextPage();
      if (musicAssets.hasNextPage) void musicAssets.fetchNextPage();
      if (adminAssets.hasNextPage) void adminAssets.fetchNextPage();
    }

    if (
      assets.hasNextPage ??
      musicAssets.hasNextPage ??
      adminAssets.hasNextPage
    ) {
      return (
        <button className="btn btn-outline btn-primary" onClick={loadMore}>
          Load More
        </button>
      );
    }
  }
}
