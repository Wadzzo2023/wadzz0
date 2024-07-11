import clsx from "clsx";
import WallateNFTs from "~/components/marketplace/platforms_nfts";
import FanAssetNfts from "~/components/marketplace/fans_assets";
import MusicAssetNfts from "~/components/marketplace/music_assets";
import { useMarketRightStore } from "~/lib/state/marketplace/right";
import { MarketMenu, useMarketMenu } from "~/lib/state/marketplace/tab-menu";
import TradeMarket from "~/components/marketplace/trade";

export default function MarketplacePage() {
  return (
    <div>
      {/* <h2>MarketplacePage</h2> */}
      <MarketTabs />
      <RenderTabs />
    </div>
  );
}

function RenderTabs() {
  const { selectedMenu } = useMarketMenu();
  switch (selectedMenu) {
    case MarketMenu.Wallate:
      return <WallateNFTs />;
    case MarketMenu.Music:
      return <MusicAssetNfts />;

    case MarketMenu.FanAsset:
      return <FanAssetNfts />;
    case MarketMenu.Trade:
      return <TradeMarket />;
  }
}

function MarketTabs() {
  const { selectedMenu, setSelectedMenu } = useMarketMenu();
  const { setData } = useMarketRightStore();
  return (
    <div role="tablist" className="tabs-boxed tabs my-5 ">
      {Object.values(MarketMenu).map((key) => {
        if (key == MarketMenu.Music) return null; // for wadzzo
        return (
          <a
            key={key}
            onClick={() => {
              setSelectedMenu(key);
              setData(undefined);
            }}
            role="tab"
            className={clsx(
              "tab",
              selectedMenu == key && "tab-active text-primary",
              "font-bold",
            )}
          >
            {key}
          </a>
        );
      })}
    </div>
  );
}
