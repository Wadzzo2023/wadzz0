import { api } from "~/utils/api";
import MarketAssetComponent from "../marketplace/market_asset";
import { MoreAssetsSkeleton } from "../marketplace/platforms_nfts";
import Asset from "./asset";

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

  const fanAssets = api.marketplace.market.getFanMarketNfts.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (
    assets.isLoading &&
    musicAssets.isLoading &&
    adminAssets.isLoading &&
    fanAssets.isLoading
  )
    return (
      <MoreAssetsSkeleton className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5" />
    );

  // if (assets.isError)
  //   return <MyError text="Error catch. Please reload this page." />;

  console.log(assets.data, musicAssets.data, adminAssets.data, "vong cong");

  if (assets.data || musicAssets.data || adminAssets.data || fanAssets.data)
    return (
      <div
        style={{
          scrollbarGutter: "stable",
        }}
        className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5"
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
        {fanAssets.data?.pages.map((page) =>
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
      if (fanAssets.hasNextPage) void fanAssets.fetchNextPage();
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
