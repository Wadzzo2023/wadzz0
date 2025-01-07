import { Facebook, Instagram, Wallet } from "lucide-react";
import { ConnectWalletButton } from "package/connect_wallet";

import { Bell, Diamond, HomeIcon, Settings2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { env } from "~/env";
import { useDrawerOpenStore } from "~/lib/state/fan/drawer_open";
import { CREATOR_PLURAL_TERM } from "~/utils/term";
import { cn } from "~/utils/utils";
import Button from "./ui/button";

export const LeftNavigation = {
  Home: { path: "/", icon: HomeIcon, text: "HOMEPAGE" },
  // WalletBalance: {
  //   path: "/walletBalance",
  //   icon: Wallet,
  //   text: "MY WALLET",
  // },
  MyAssets: { path: "/assets", icon: Bell, text: "COLLECTION" },
  // Search: { path: "/search", icon: Search, text: "Search" },
  Music: { path: "/music", icon: Diamond, text: "MUSIC" },
  Marketplace: { path: "/marketplace", icon: Bell, text: "MARKETPLACE" },
  Bounty: { path: "/bounty", icon: Bell, text: "BOUNTY" },
  Fan: {
    path: "/fans/home",
    icon: Bell,
    text: CREATOR_PLURAL_TERM.toLocaleUpperCase(),
  },
  Settings: { path: "/settings", icon: Settings2, text: "MY PROFILE" },
} as const;
export const BottomNavigation = {
  Claim: { path: "/maps/pins/my", icon: HomeIcon, text: "CLAIM" },
} as const;

export default function LeftBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full max-h-screen w-80 flex-col items-center justify-between gap-4 overflow-auto bg-base-100/80 px-4 pb-4 scrollbar-hide ",
        className,
      )}
    >
      <div className="flex h-full w-full flex-1 flex-col items-center justify-between gap-2 overflow-auto overflow-x-hidden">
        <div className="mt-2  w-full flex-1">
          <NavigationButtons />
        </div>
      </div>
      <div className="flex w-full flex-col items-center ">
        <LeftBottom />
      </div>
    </div>
  );
}

function NavigationButtons() {
  const { setIsOpen } = useDrawerOpenStore();
  return (
    <div className="flex h-full min-h-full flex-col justify-between gap-2">
      <div className="flex  flex-col  gap-2">
        {Object.entries(LeftNavigation).map(
          ([key, { path, icon: Icon, text }]) => {
            if (text == "MUSIC") return;

            return (
              <Link href={path} className="w-full" key={key}>
                <Button
                  path={path}
                  icon={<Icon className="h-5 w-5" />}
                  text={text}
                />
              </Link>
            );
          },
        )}
      </div>
      <div className="flex   flex-col  gap-2">
        {Object.entries(BottomNavigation).map(
          ([key, { path, icon: Icon, text }]) => (
            <Link href={path} className="w-full " key={key}>
              <Button
                className="mb-2  rounded-lg bg-gradient-to-br from-green-400 to-blue-600  text-center text-sm font-medium text-white hover:bg-gradient-to-bl focus:outline-none focus:ring-4 focus:ring-green-200 dark:focus:ring-green-800"
                path={path}
                icon={<Icon className="h-5 w-5" />}
                text={text}
              />
            </Link>
          ),
        )}
      </div>
    </div>
  );
}

function LeftBottom() {
  return (
    <div className="flex w-full flex-col justify-center gap-1">
      <ConnectWalletButton />
      <div className="flex justify-between space-x-2">
        <Link
          href={"https://facebook.com/wadzzo"}
          className="btn flex h-16 flex-col items-center  text-xs normal-case"
          target="_blank"
        >
          <Facebook size={20} />
          <span>Facebook</span>
        </Link>
        <Link
          href={"https://x.com/WadzzoApp"}
          className="btn flex h-16 flex-1 flex-col items-center text-xs normal-case "
          target="_blank"
        >
          <Image src="/images/icons/x.svg" alt="X" height={18} width={18} />
          <span>X</span>
        </Link>
        <Link
          href={"https://www.instagram.com/wadzzo"}
          className="btn flex h-16 flex-col items-center text-xs normal-case"
          target="_blank"
        >
          <Instagram />
          <span>Instagram</span>
        </Link>
      </div>
      <div className="flex w-full flex-col text-center text-xs text-base-content">
        <p>© 2024 {env.NEXT_PUBLIC_HOME_DOMAIN}</p>
        <div className="flex w-full justify-center gap-2 ">
          <Link className="link-hover link" href="/about">
            About
          </Link>
          <Link className="link-hover link" href="/privacy">
            Privacy
          </Link>
          <Link className="link-hover link" href="/support">
            Support
          </Link>
        </div>
        <p>v{1.1}</p>
      </div>
    </div>
  );
}
