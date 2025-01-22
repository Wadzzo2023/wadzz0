import { api } from "~/utils/api";
import MarketAssetComponent from "../marketplace/market_asset";
import { MoreAssetsSkeleton } from "../marketplace/platforms_nfts";
import Asset from "./asset";
import PageAssetComponent from "../marketplace/page_asset";

export default function AllAsset() {


  const musicAssets = api.music.song.getAllSongMarketAssets.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const adminAssets =
    api.marketplace.market.getMarketAdminNfts.useInfiniteQuery(
      { limit: 10 },
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
  const artistAssets = api.marketplace.market.getPageAssets.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (

    musicAssets.isLoading &&
    adminAssets.isLoading &&
    fanAssets.isLoading &&
    artistAssets.isLoading
  )
    return (
      <MoreAssetsSkeleton className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" />
    );

  // if (assets.isError)
  //   return <MyError text="Error catch. Please reload this page." />;


  if (musicAssets.data?.pages?.length ??
    adminAssets.data?.pages?.length ??
    fanAssets.data?.pages?.length)
    return (
      <div
        className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
      >

        {musicAssets.data?.pages.map((page, i) =>
          page.nfts.map((item, j) => <MarketAssetComponent key={`music-${i}-${j}`} item={item}
          />)
        )}
        {adminAssets.data?.pages.map((page, i) =>
          page.nfts.map((item, j) => <MarketAssetComponent key={`admin-${i}-${j}`} item={item} />)
        )}
        {fanAssets.data?.pages.map((page, i) =>
          page.nfts.map((item, j) => <MarketAssetComponent key={`fan-${i}-${j}`} item={item} />)
        )}
        {artistAssets.data?.pages.map((page, i) =>
          page.nfts.map((item, j) => <PageAssetComponent key={`artist-${i}-${j}`} item={item} />)
        )}

        {musicAssets.hasNextPage ? (
          <button
            className="btn btn-outline btn-primary"
            onClick={() => void musicAssets.fetchNextPage()}
          >
            Load More
          </button>
        ) :
          adminAssets.hasNextPage ? (
            <button
              className="btn btn-outline btn-primary"
              onClick={() => void adminAssets.fetchNextPage()}
            >
              Load More
            </button>
          ) :
            fanAssets.hasNextPage ? (
              <button
                className="btn btn-outline btn-primary"
                onClick={() => void fanAssets.fetchNextPage()}
              >
                Load More
              </button>
            ) : null
        }
      </div>
    );


}
