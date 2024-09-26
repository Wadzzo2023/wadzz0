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
    case "Wallet":
      return <WallateNFTs />;
    case "Music":
      return <MusicAssetNfts />;

    case "FanAsset":
      return <FanAssetNfts />;
    case "Trade":
      return <TradeMarket />;
  }
}

function MarketTabs() {
  const { selectedMenu, setSelectedMenu } = useMarketMenu();
  const { setData } = useMarketRightStore();
  return (
    <div role="tablist" className="tabs-boxed tabs my-5 ">
      {Object.keys(MarketMenu).map((key) => {
        if (MarketMenu[key as keyof typeof MarketMenu] === MarketMenu.Music)
          return null; // for wadzzo
        return (
          <a
            key={key}
            onClick={() => {
              setSelectedMenu(key as keyof typeof MarketMenu);
              setData(undefined);
            }}
            role="tab"
            className={clsx(
              "tab",
              selectedMenu === key && "tab-active text-primary",
              "font-bold",
            )}
          >
            {MarketMenu[key as keyof typeof MarketMenu]}
          </a>
        );
      })}
    </div>
  );
}
