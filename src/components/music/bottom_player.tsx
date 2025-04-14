import clsx from "clsx";
import { X } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { usePlayerStore } from "~/lib/state/music/track";
import BottonPlayer from "../bottom_player";

export default function BottomPlayerContainer() {
  const router = useRouter();

  // return (
  //   <div className={clsx("absolute bottom-0 w-full")}>
  //     <div className="flex items-center justify-center">
  //       <Player />
  //     </div>
  //   </div>
  // );

  return (
    <div
      className={clsx(
        "absolute bottom-0 flex h-0 w-full justify-center  bg-red-300",
      )}
    >
      <div className="relative flex w-full justify-center bg-blue-200">
        <div className=" absolute -top-40 w-full max-w-2xl">
          <Player />
        </div>
      </div>
      {/* <div className=" flex items-center justify-center"> */}

      {/* </div> */}
    </div>
  );
}

function Player() {
  const [isHovered, setIsHovered] = useState(false);
  const { bottomVisiable, isPlaying, setNewTrack } = usePlayerStore();
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full max-w-2xl"
    >
      <BottonPlayer />
      {isHovered && (
        <button
          className="btn btn-circle btn-primary btn-sm absolute -top-4 right-0 -mb-8"
          onClick={() => setNewTrack(undefined)}
        >
          <X />
        </button>
      )}
    </div>
  );
}
