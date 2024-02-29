import clsx from "clsx";
import React from "react";
import WallateNFTs from "~/components/marketplace/bandcoin_nfts";
import { MarketMenu, useMarketMenu } from "~/lib/state/marketplace/tab-menu";

export default function MarketplacePage() {
  return (
    <div>
      <h2>MarketplacePage</h2>
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
  }
}

function MarketTabs() {
  const { selectedMenu, setSelectedMenu } = useMarketMenu();
  return (
    <div role="tablist" className="tabs-boxed tabs my-5 ">
      {Object.values(MarketMenu).map((key) => {
        return (
          <a
            key={key}
            onClick={() => setSelectedMenu(key)}
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
