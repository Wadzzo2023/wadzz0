import { useRouter } from "next/router";

import Right from "./wallete/right";
import { MusicRightSide } from "./music/music_right";

export default function RightBar() {
  const router = useRouter();
  if (router.pathname == "/")
    return (
      <div className="hidden h-full w-80  flex-col bg-base-100/80  lg:flex">
        <Right />
      </div>
    );
  else if (router.pathname == "/music")
    return (
      <div className="hidden h-full w-80  flex-col bg-base-100/80  lg:flex">
        <MusicRightSide />
      </div>
    );
}
