import { ConnectWalletButton } from "package/connect_wallet";
import { Facebook, Instagram, Wallet } from "lucide-react";

import Button from "./ui/button";
import Link from "next/link";
import { HomeIcon, Settings2, Diamond, Bell } from "lucide-react";
import Image from "next/image";
import { cn } from "~/utils/utils";
import { env } from "~/env";

export const LeftNavigation = {
  Home: { path: "/", icon: HomeIcon, text: "HOMEPAGE" },
  WalletBalance: {
    path: "/walletBalance",
    icon: Wallet,
    text: "MY WALLET",
  },
  MyAssets: { path: "/assets", icon: Bell, text: "ASSET BALANCE" },
  // Search: { path: "/search", icon: Search, text: "Search" },
  Music: { path: "/music", icon: Diamond, text: "MUSIC" },
  Marketplace: { path: "/marketplace", icon: Bell, text: "MARKETPLACE" },
  Fan: { path: "/fans/home", icon: Bell, text: "ARTISTS" },
  Settings: { path: "/settings", icon: Settings2, text: "SETTINGS" },
} as const;
export const BottomNavigation = {
  Home: { path: "/maps/pins", icon: HomeIcon, text: "CLAIM" },
} as const;

export default function LeftBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full max-h-screen w-80 flex-col items-center justify-between overflow-auto bg-base-100/80 px-4 pb-4 pt-10 scrollbar-hide",
        className,
      )}
    >
      <div className="flex h-full w-full flex-1 flex-col items-center justify-between gap-2">
        <div className="mt-7  w-full flex-1">
          <NavigationButtons />
        </div>
      </div>
      <div className="flex w-full flex-col items-center">
        <LeftBottom />
      </div>
    </div>
  );
}

function NavigationButtons() {
  return (
    <div className="flex h-full min-h-full flex-col justify-between gap-2">
      <div className="flex  flex-col  gap-2">
        {Object.entries(LeftNavigation).map(
          ([key, { path, icon: Icon, text }]) => (
            <Link href={path} className="w-full" key={key}>
              <Button
                path={path}
                icon={<Icon className="h-5 w-5" />}
                text={text}
              />
            </Link>
          ),
        )}
      </div>
      {/* <div className="flex   flex-col  gap-2">
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
      </div> */}
    </div>
  );
}

function LeftBottom() {
  return (
    <div className="flex w-full flex-col justify-center gap-1">
      <ConnectWalletButton />
      <div className="flex justify-between space-x-2">
        <Link
          href={"https://facebook.com/bandcoinio"}
          className="btn flex h-16 flex-col items-center  text-xs normal-case"
          target="_blank"
        >
          <Facebook size={20} />
          <span>Facebook</span>
        </Link>
        <Link
          href={"https://x.com/bandcoinio"}
          className="btn flex h-16 flex-1 flex-col items-center text-xs normal-case "
          target="_blank"
        >
          <Image src="/images/icons/x.svg" alt="X" height={18} width={18} />
          <span>X</span>
        </Link>
        <Link
          href={"https://www.instagram.com/bandcoin"}
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
        </div>
        <p>v{1.1}</p>
      </div>
    </div>
  );
}
