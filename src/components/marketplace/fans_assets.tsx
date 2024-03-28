import { api } from "~/utils/api";
import { useConnectWalletStateStore } from "package/connect_wallet";
import MarketAssetComponent from "./market_asset";

export default function FanAssetNfts() {
  // first fetch from database and later validate
  const { pubkey } = useConnectWalletStateStore();
  const assets = api.marketplace.market.getFanMarketNfts.useInfiniteQuery(
    { limit: 4 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

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
            // <li className="bg-blue-200" key={i}>
            //   {`${item.asset.name} ${item.asset.code}`}
            //   {item.creatorId == pubkey ? (
            //     <button
            //       className="btn btn-primary btn-sm"
            //       onClick={() => {
            //         toggleVisibility.mutate({
            //           id: item.id,
            //           visibility: false,
            //         });
            //       }}
            //     >
            //       {toggleVisibility.isLoading && (
            //         <span className="loading loading-spinner" />
            //       )}
            //       Disable
            //     </button>
            //   ) : (
            //     <BuyModal item={{ asset: item.asset }} />
            //   )}
            // </li>
            <MarketAssetComponent key={i} item={item} />
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
