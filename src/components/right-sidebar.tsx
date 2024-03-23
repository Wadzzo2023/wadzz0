import { useRouter } from "next/router";

import Right from "./wallete/right";
import { MusicRightSide } from "./music/music_right";
import RightBar from "./fan/fan-right";
import MarketRight from "./marketplace/market_right";
import AssetRight from "./my_asset/asset_right";

export default function RightSideBar() {
  const router = useRouter();
  if (router.pathname == "/")
    return (
      <div className="hidden h-full w-80  flex-col bg-base-100/80  lg:flex">
        <Right />
      </div>
    );
  else if (router.pathname.includes("/music"))
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
  }
}
