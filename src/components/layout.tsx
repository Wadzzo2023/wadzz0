import clsx from "clsx";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { ConnectWalletButton } from "package/connect_wallet";
import React from "react";
import Header from "./header";
import LeftBar from "./left-sidebar";
import RightDialog from "./right_dialog";

const BottomPlayerContainer = dynamic(() => import("./music/bottom_player"));

export default function Layout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { data } = useSession();
  const router = useRouter();

  if (router.pathname === "/maps") {
    return (
      <div className="flex">
        <LeftBar className="hidden md:flex" />
        {children}
      </div>
    );
  }

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

            {/* {data?.user.id && <RightSideBar />} */}
          </div>
        </div>
        <RightDialog />
        <BottomPlayerContainer />
      </div>
    </>
  );
}
