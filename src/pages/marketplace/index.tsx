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
  const [layoutMode, setLayoutMode] = useState<"modern" | "legacy">("modern");

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
      <MarketTabs layoutMode="legacy" />
      <RenderTabs />
    </div>
  );
}

function ModernMarketplacePage() {
  return (
    <div className="md:mx-auto md:w-[85vw]">
      <MarketTabs layoutMode="modern" />
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

function MarketTabs({ layoutMode }: { layoutMode: "modern" | "legacy" }) {
  const { selectedMenu, setSelectedMenu } = useMarketMenu();
  const { setData } = useMarketRightStore();
  const tabs = Object.keys(MarketMenu).filter((key) => {
    return MarketMenu[key as keyof typeof MarketMenu] !== MarketMenu.Music;
  });

  if (layoutMode === "modern") {
    return (
      <div className="my-5 flex w-full justify-center">
        <div className="relative w-fit overflow-hidden rounded-[0.9rem] border border-black/15 bg-[#f3f1ea]/80 p-[0.3rem] shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
          <div className="inline-flex items-center gap-0.5">
            {tabs.map((key) => {
              const isActive = selectedMenu === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelectedMenu(key as keyof typeof MarketMenu);
                    setData(undefined);
                  }}
                  className={clsx(
                    "relative inline-flex items-center justify-center rounded-[0.7rem] border px-3 py-1.5 text-sm font-normal transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                    isActive
                      ? "border-white/60 bg-white/55 text-black shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.92),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.72),_0_8px_20px_rgba(255,255,255,0.24)] backdrop-blur-[6px]"
                      : "border-transparent bg-transparent text-black/65 hover:bg-white/35 hover:text-black",
                  )}
                >
                  {MarketMenu[key as keyof typeof MarketMenu]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div role="tablist" className="tabs-boxed tabs my-5 ">
      {tabs.map((key) => {
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
