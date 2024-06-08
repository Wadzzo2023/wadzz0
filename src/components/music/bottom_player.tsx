import clsx from "clsx";
import { X } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { usePlayerStore } from "~/lib/state/music/track";
import BottonPlayer from "../bottom_player";

export default function BottomPlayerContainer() {
  const router = useRouter();
  const { bottomVisiable, isPlaying, setNewTrack } = usePlayerStore();

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={clsx("absolute bottom-0 w-full")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-center">
        <div className="w-full max-w-2xl">
          {isHovered && (
            <button
              className="btn btn-circle btn-secondary btn-sm -mb-8"
              onClick={() => setNewTrack(undefined)}
            >
              <X />
            </button>
          )}
          <BottonPlayer />
        </div>
      </div>
    </div>
  );
  // } else {
  // if (isPlaying)
  //   return (
  //     <div className="absolute bottom-0 w-full">
  //       <div className="flex items-center justify-center">
  //         <div className="w-full max-w-2xl">
  //           <BottonPlayer />
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }
}
