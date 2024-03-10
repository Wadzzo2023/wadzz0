import clsx from "clsx";
import { Fan } from "lucide-react";
import React from "react";
import WallateNFTs from "~/components/marketplace/bandcoin_nfts";
import FanAssetNfts from "~/components/marketplace/fans_assets";
import { MarketMenu, useMarketMenu } from "~/lib/state/marketplace/tab-menu";
import { api } from "~/utils/api";

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
    case MarketMenu.Music:
      return <MusicNFts />;

    case MarketMenu.FanAsset:
      return <FanAssetNfts />;
  }
}

function MusicNFts() {
  const songs = api.music.song.getAllSong.useQuery();
  if (songs.isLoading) return <div>Loading...</div>;
  if (songs.isError) return <div>Error</div>;
  if (songs.data) {
    return (
      <div>
        {songs.data.map((song) => {
          return <div key={song.id}>{song.artist}</div>;
        })}
      </div>
    );
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
