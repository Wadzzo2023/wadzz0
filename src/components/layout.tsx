"use client";

import clsx from "clsx";
import { getCookie, setCookie } from "cookies-next";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

import { Toaster } from "~/components/ui/toaster";
import PlayLayout from "./play/layout";
import ModalProvider from "./providers/modal-provider";
import PlayModalProvider from "./providers/play/play-modal-provider";
import { ThemeProvider } from "./providers/theme-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import { BackgroundMusicProvider } from "./context/BackgroundMusicContext";
import { PlayerProvider } from "./context/PlayerContext";
import { PostAudioProvider } from "./context/PostAudioContext";
import { PostVideoProvider } from "./context/PostVideoContext";
import FallingSnowflakes from "./christmas/FallingSnowflakes";
import { Player } from "./Player";
import { PlayerToggle } from "./playerToggle";

const RightDialog = dynamic(async () => await import("./right_dialog"));
const ConnectWalletButton = dynamic(
  async () => await import("../components/ui/wallate_button"),
);
const Header = dynamic(async () => await import("./header"));
const RightSideBar = dynamic(async () => await import("./right-sidebar"));
const LeftBar = dynamic(async () => await import("./left-sidebar"));
const GlobalFloatingNav = dynamic(
  async () => await import("./navigation/global-floating-nav"),
  { ssr: false },
);

const LAYOUT_MODE_COOKIE = "wadzzo-layout-mode";
type LayoutMode = "modern" | "legacy";

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
  const publicRoutes = ["/about", "/privacy", "/support"];
  const isPublicRoute = publicRoutes.includes(router.pathname);

  const [layoutMode, setLayoutMode] = useState<LayoutMode>("legacy");
  const [hasOpenDialog, setHasOpenDialog] = useState(false);
  const isLegacyLayout = layoutMode === "legacy";

  useEffect(() => {
    const storedMode = getCookie(LAYOUT_MODE_COOKIE);
    if (storedMode === "legacy" || storedMode === "modern") {
      setLayoutMode(storedMode);
    }
  }, []);

  useEffect(() => {
    const detectOpenDialog = () => {
      if (typeof document === "undefined") return;
      const openDialogs = document.querySelectorAll(
        '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]',
      );
      setHasOpenDialog(openDialogs.length > 0);
    };

    detectOpenDialog();
    const observer = new MutationObserver(detectOpenDialog);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-state", "role"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isLegacyLayout ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLegacyLayout]);

  const onToggleLayoutMode = () => {
    const nextMode: LayoutMode = isLegacyLayout ? "modern" : "legacy";
    setLayoutMode(nextMode);
    setCookie(LAYOUT_MODE_COOKIE, nextMode, {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  };

  if (router.pathname.includes("/embed")) {
    return (
      <div className="flex h-screen ">
        <div className="flex-1">{children}</div>
      </div>
    );
  }

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
      <ThemeProvider defaultTheme="light" enableSystem disableTransitionOnChange>
        <PostAudioProvider>
          <PostVideoProvider>
            <PlayerProvider>
              <BackgroundMusicProvider>
                <div className={clsx("flex h-screen w-full flex-col", className)}>
                  <Header
                    layoutMode={layoutMode}
                    onToggleLayoutMode={onToggleLayoutMode}
                  />

                  {isLegacyLayout ? (
                    <div className="flex-1 overflow-auto bg-base-100/50">
                      <div className="flex h-full border-t-2">
                        <LeftBar
                          className="hidden xl:flex"
                          layoutMode="legacy"
                          onToggleLayoutMode={onToggleLayoutMode}
                        />
                        <div className="flex-1 border-x-2">
                          <div className="h-full overflow-y-auto bg-base-100/80 scrollbar-hide">
                            {session.status === "authenticated" ? (
                              <>
                                <ModalProvider />
                                <PlayModalProvider />
                                {children}
                              </>
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                {isPublicRoute ? (
                                  <div
                                    className={clsx(
                                      "flex h-screen w-full flex-col",
                                      className,
                                    )}
                                  >
                                    <div className="flex-1 overflow-auto bg-base-100/50">
                                      {children}
                                    </div>
                                  </div>
                                ) : (
                                  <ConnectWalletButton />
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {router.pathname !== "/walletBalance" &&
                          router.pathname !== "/assets" &&
                          router.pathname !== "/" &&
                          router.pathname !== "/notification" &&
                          router.pathname !== "/bounty/[id]" &&
                          router.pathname !== "/settings" &&
                          router.pathname !== "/marketplace" &&
                          router.pathname !== "/about" &&
                          router.pathname !== "/support" &&
                          router.pathname !== "/privacy" &&
                          session.status === "authenticated" && <RightSideBar />}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-auto bg-base-100/50">
                      <div className="h-full overflow-y-auto bg-base-100/80 pb-24 md:pb-28 scrollbar-hide">
                        {session.status === "authenticated" ? (
                          <>
                            <ModalProvider />
                            <PlayModalProvider />
                            {children}
                          </>
                        ) : isPublicRoute ? (
                          <>{children}</>
                        ) : (
                          <div className="flex h-full min-h-[50vh] items-center justify-center">
                            <ConnectWalletButton />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <RightDialog />
                  <Player />
                  <Toaster />
                </div>

                {!isLegacyLayout && !hasOpenDialog && session.status === "authenticated" ? (
                  <GlobalFloatingNav />
                ) : null}

                {isMusicRoute ? <PlayerToggle /> : null}
              </BackgroundMusicProvider>
            </PlayerProvider>
          </PostVideoProvider>
        </PostAudioProvider>
      </ThemeProvider>
    </>
  );
}
