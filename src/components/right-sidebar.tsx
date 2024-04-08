import { useRouter } from "next/router";

import Right from "./wallete/right";
import { MusicRightSide } from "./music/music_right";
import RightBar from "./fan/fan-right";
import MarketRight from "./marketplace/market_right";
import AssetRight from "./my_asset/asset_right";
import AdminRightSide from "./wallete/admin_right";
import { useTagStore } from "~/lib/state/wallete/tag";
import { MarketType } from "@prisma/client";
import { usePopUpState } from "~/lib/state/right-pop";

export default function RightSideBar() {
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
    if (selectedTag == MarketType.ADMIN) return <MarketRight />;
    if (selectedTag == MarketType.SONG) return <MarketRight />;
    if (selectedTag == "Other") return <Right />;
    if (selectedTag === undefined) {
      if (pop.type == MarketType.ADMIN) return <MarketRight />;
      if ((pop.type = "Other")) return <Right />;
    }
  } else if (router.pathname.includes("/music")) return <MusicRightSide />;
  else if (router.pathname.includes("/fans")) return <RightBar />;
  else if (router.pathname.includes("/marketplace")) {
    return <MarketRight />;
  } else if (router.pathname.includes("/assets")) {
    return <AssetRight />;
  } else if (router.pathname.includes("/me/admin")) {
    return <AdminRightSide />;
  }
}
