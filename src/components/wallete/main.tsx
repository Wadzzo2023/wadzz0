import { useTagStore } from "~/lib/state/wallete/tag";
import AllAsset from "./all_asset";
import AllTag from "./all_tags";
import WallateNFTs from "../marketplace/bandcoin_nfts";
import MusicAssetNfts from "../marketplace/music_assets";
import OtherAssets from "./other_assets";
import { AssetVariant } from "../right-sidebar";

function Main() {
  return (
    <div className="h-full space-y-2 tracking-wider">
      <AllTag />
      <div className="h-full space-y-2">
        <HomeAssets />
      </div>
    </div>
  );
}

export default Main;

function HomeAssets() {
  const { selectedTag } = useTagStore();
  if (selectedTag) {
    if (selectedTag == AssetVariant.ADMIN) return <WallateNFTs />;
    if (selectedTag == AssetVariant.SONG) return <MusicAssetNfts />;
    if (selectedTag == AssetVariant.Other) return <OtherAssets />;
  } else return <AllAsset />;
}
