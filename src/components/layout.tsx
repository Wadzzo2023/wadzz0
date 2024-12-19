"use client";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React from "react";
import { ThemeProvider } from "./providers/theme-provider";
import ModalProvider from "./providers/modal-provider";
import { api } from "~/utils/api";
import { Toaster } from "~/components/ui/toaster";
import PlayLayout from "./play/layout";
import PlayModalProvider from "./providers/play/play-modal-provider";
// import Header from "./header";
// import RightDialog from "./right_dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/shadcn/ui/card";
import { PlayerToggle } from "./playerToggle";
import { PlayerProvider } from "./context/PlayerContext";
import { Player } from "./Player";
import SnowEffect from "./Snowflake";
import FallingSnowflakes from "./FallingSnowflakes";

const RightDialog = dynamic(async () => await import("./right_dialog"));
const ConnectWalletButton = dynamic(
  async () => await import("../components/ui/wallate_button"),
);

const Header = dynamic(async () => await import("./header"));

const RightSideBar = dynamic(async () => await import("./right-sidebar"));
const LeftBar = dynamic(async () => await import("./left-sidebar"));

const BottomPlayerContainer = dynamic(() => import("./music/bottom_player"));

export default function Layout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const session = useSession();
  const router = useRouter();
  const isMusicRoute = router.pathname.startsWith("/music");

  // if (router.pathname.includes("/maps")) {
  //   return (
  //     <div className="flex">
  //       <MapLeft className="hidden md:flex" />
  //       {/* <LeftBar className="hidden md:flex" /> */}
  //       {children}
  //     </div>
  //   );
  // }


  if (router.pathname.includes("/albedo")) {
    return <div>{children}</div>;
  }

  if (router.pathname.includes("/play")) {
    if (router.pathname.includes("/play/ar")) {
      return <>{children}</>;
    }
    return (
      <>
        {session.status === "authenticated" ? (
          <PlayLayout>
            <PlayModalProvider />
            {children}
          </PlayLayout>
        ) : (
          <div className="flex h-screen items-center justify-center bg-gray-100">
            <Card className="w-[350px]">
              <CardHeader>
                <CardTitle>Welcome to WadzzoAR</CardTitle>
                <CardDescription>
                  Please login/signup to continue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConnectWalletButton />
              </CardContent>
            </Card>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <ThemeProvider
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      > <PlayerProvider>
          <div className={clsx(" flex h-screen w-full flex-col", className)}>
            <Header />

            <div className="flex-1 overflow-auto bg-base-100/50">
              <div className="flex h-full border-t-2">
                <LeftBar className="hidden xl:flex" />
                <div
                  // id="ih"
                  className="flex-1 border-x-2"
                // style={
                //   router.pathname.includes("/fans/creator") && creator.data
                //     ? {
                //         background: `url("${creator.data.backgroundSVG}")`,
                //         backgroundSize: "10%",
                //         animation: "pan 135s linear infinite",
                //       }
                //     : {
                //         background: `url("images/guitar.svg")`,
                //         backgroundSize: "10%",
                //         animation: "pan 135s linear infinite",
                //       }
                // }
                >
                  <div className=" h-full overflow-y-auto bg-base-100/80 scrollbar-hide">
                    {session.status == "authenticated" ? (
                      <>
                        <ModalProvider />
                        <PlayModalProvider />
                        {children}
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ConnectWalletButton />
                      </div>
                    )}
                    <div className="h-44 " />
                    {/* <BottomNav /> */}
                  </div>
                </div>

                {router.pathname !== "/walletBalance" &&
                  router.pathname !== "/assets" &&
                  router.pathname !== "/" &&
                  router.pathname !== "/notification" &&
                  router.pathname !== "/bounty/[id]" &&
                  router.pathname !== "/settings" &&
                  router.pathname !== "/about" &&
                  router.pathname !== "/support" &&
                  router.pathname !== "/privacy" &&
                  session.status == "authenticated" && <RightSideBar />}
              </div>
            </div>
            <RightDialog />
            <Player />
            {/* <BottomPlayerContainer /> */}
            <Toaster />
          </div>
          {isMusicRoute && <PlayerToggle />}
          <FallingSnowflakes />
        </PlayerProvider>
      </ThemeProvider>
    </>
  );
}
