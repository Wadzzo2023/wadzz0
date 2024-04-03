import { useRouter } from "next/router";

import Right from "./wallete/right";
import { MusicRightSide } from "./music/music_right";
import RightBar from "./fan/fan-right";
import MarketRight from "./marketplace/market_right";
import AssetRight from "./my_asset/asset_right";
import AdminRightSide from "./wallete/admin_right";
import { useTagStore } from "~/lib/state/wallete/tag";

export default function RightSideBar() {
  const router = useRouter();
  const { selectedTag } = useTagStore();
  if (router.pathname == "/") {
    if (selectedTag == "bandcoin")
      return (
        <div className="hidden h-full w-80  flex-col bg-base-100/80  lg:flex">
          <MarketRight />
        </div>
      );
    else
      return (
        <div className="hidden h-full w-80  flex-col bg-base-100/80  lg:flex">
          <Right />
        </div>
      );
  } else if (router.pathname.includes("/music"))
    return (
      <div className="hidden h-full w-80  flex-col bg-base-100/80  lg:flex">
        <MusicRightSide />
      </div>
    );
  else if (router.pathname.includes("/fans"))
    return (
      <div className="hidden h-full w-80  flex-col bg-base-100/80  lg:flex">
        <RightBar />
      </div>
    );
  else if (router.pathname.includes("/marketplace")) {
    return (
      <div className="hidden h-full w-80  flex-col bg-base-100/80  lg:flex">
        <MarketRight />
      </div>
    );
  } else if (router.pathname.includes("/assets")) {
    return (
      <div className="hidden h-full w-80  flex-col bg-base-100/80  lg:flex">
        <AssetRight />
      </div>
    );
  } else if (router.pathname.includes("/me/admin")) {
    return (
      <div className="hidden h-full w-80  flex-col bg-base-100/80  lg:flex">
        <AdminRightSide />
      </div>
    );
  }
}
