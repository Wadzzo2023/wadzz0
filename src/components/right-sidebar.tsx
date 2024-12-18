import { useRouter } from "next/router";

import Right from "./wallete/right";
import { MusicRightSide } from "./music/music_right";
import RightBar from "./fan/fan-right";
import MarketRight from "./marketplace/market_right";
import AssetRight from "./my_asset/asset_right";
import AdminRightSide from "./admin/admin_right";
import { useTagStore } from "~/lib/state/wallete/tag";
import { MarketType } from "@prisma/client";
import { usePopUpState } from "~/lib/state/right-pop";
import Drawer from "./drawer";
import PageAssetRight from "./wallete/page_asset_right";
import { CREATOR_PLURAL_TERM } from "~/utils/term";
import BountyRightBar from "./fan/creator/bounty/BountyRightSide";
import FunctionTest from "~/pages/functiontest";

export const AssetVariant = {
  ...MarketType,
  Other: "Other",
  Artists: CREATOR_PLURAL_TERM,
} as const;

export default function RightSideBar() {
  const router = useRouter();
  if (router.pathname.includes("/maps")) return undefined;
  return (
    <div>
      <div className="absolute bottom-0 right-0 lg:hidden">
        <Drawer />
      </div>
      <RightSideBarComponent />
    </div>
  );
}
function RightSideBarComponent() {
  const router = useRouter();
  if (router.pathname.includes("/maps")) return undefined;

  return (
    <div className="hidden h-full w-80  flex-col bg-base-100/80  lg:flex">
      <RightComponent />
    </div>
  );
}

export function RightComponent() {
  const router = useRouter();
  const { selectedTag } = useTagStore();
  const pop = usePopUpState();
  if (router.pathname == "/") {
    if (selectedTag == AssetVariant.ADMIN) return <MarketRight />;
    if (selectedTag == AssetVariant.SONG) return <MarketRight />;
    if (selectedTag == AssetVariant.Other) return <Right />;
    if (selectedTag == AssetVariant.FAN) return <MarketRight />;
    // if (selectedTag == AssetVariant.Artists) return <PageAssetRight />;
    if (selectedTag === undefined) {
      if (pop.type == AssetVariant.ADMIN) return <MarketRight />;
      if ((pop.type = AssetVariant.Other)) return <PageAssetRight />;
    }
  } else if (router.pathname.includes("/music")) return <MusicRightSide />;
  else if (router.pathname.includes("/fans")) return <RightBar />;
  else if (router.pathname.includes("/marketplace")) {
    return <MarketRight />;
  } else if (router.pathname.includes("/assets")) {
    return <AssetRight />;
  } else if (router.pathname.includes("/admin")) {
    return <AdminRightSide />;
  } else if (router.pathname.includes("/bounty")) {
    return <BountyRightBar />;
  } else if (router.pathname.includes("/functiontest")) return <FunctionTest />;
}
