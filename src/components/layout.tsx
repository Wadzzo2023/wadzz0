import React, { useState } from "react";
import LeftBar from "./left-sidebar";
import RightSideBar from "./right-sidebar";
import { ConnectWalletButton } from "package/connect_wallet";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import Header from "./header";
import RightDialog from "./right_dialog";
import BottonPlayer from "./bottom_player";
import { usePlayerStore } from "~/lib/state/music/track";
import { useRouter } from "next/router";
import { X } from "lucide-react";

export default function Layout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { data } = useSession();

  return (
    <>
      <div className={clsx(" flex h-screen flex-col", className)}>
        <Header />

        <div className="flex-1 overflow-auto bg-base-100/50">
          <div className="flex h-full border-t-2">
            <LeftBar className="hidden md:flex" />
            <div className="flex-1 border-x-2 ">
              <div className=" h-full overflow-y-auto bg-base-100/80 scrollbar-hide">
                {data?.user.id ? (
                  <>{children}</>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ConnectWalletButton />
                  </div>
                )}
                <div className="h-44 " />
                {/* <BottomNav /> */}
              </div>
            </div>

            {data?.user.id && <RightSideBar />}
          </div>
        </div>
        <RightDialog />
        <BottomPlayerContainer />
      </div>
    </>
  );
}

function BottomPlayerContainer() {
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
