import { api } from "~/utils/api";
import BuyModal from "../music/modal/buy_modal";
import { useConnectWalletStateStore } from "package/connect_wallet";

export default function FanAssetNfts() {
  // first fetch from database and later validate
  const { pubkey } = useConnectWalletStateStore();
  const assets = api.marketplace.market.getMarketNft.useInfiniteQuery(
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
        <p>hi</p>
        {assets.data.pages.map((page) =>
          page.nfts.map((item, i) => (
            <li className="bg-blue-200" key={i}>
              {`${item.asset.name} ${item.asset.code}`}
              {item.creatorId == pubkey ? (
                <p>tak back</p>
              ) : (
                <BuyModal item={{ asset: item.asset }} />
              )}
            </li>
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
