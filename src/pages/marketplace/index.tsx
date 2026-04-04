import clsx from "clsx";
import { getCookie } from "cookies-next";
import { useEffect, useState } from "react";
import WallateNFTs from "~/components/marketplace/platforms_nfts";
import FanAssetNfts from "~/components/marketplace/fans_assets";
import MusicAssetNfts from "~/components/marketplace/music_assets";
import { useMarketRightStore } from "~/lib/state/marketplace/right";
import { MarketMenu, useMarketMenu } from "~/lib/state/marketplace/tab-menu";
import MarketPageAsset from "~/components/marketplace/trade";

export default function MarketplacePage() {
  const [layoutMode, setLayoutMode] = useState<"modern" | "legacy">("legacy");

  useEffect(() => {
    const storedMode = getCookie("wadzzo-layout-mode");
    if (storedMode === "modern" || storedMode === "legacy") {
      setLayoutMode(storedMode);
    }
  }, []);

  if (layoutMode === "modern") {
    return <ModernMarketplacePage />;
  }

  return <LegacyMarketplacePage />;
}

function LegacyMarketplacePage() {
  return (
    <div>
      {/* <h2>MarketplacePage</h2> */}
      <MarketTabs />
      <RenderTabs />
    </div>
  );
}

function ModernMarketplacePage() {
  return (
    <div className="md:mx-auto md:w-[85vw]">
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
    case "PageAsset":
      return <MarketPageAsset />;
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
