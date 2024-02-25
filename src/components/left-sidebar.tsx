import {
  ConnectWalletButton,
  useConnectWalletStateStore,
} from "package/connect_wallet";
import React from "react";
import Avater from "./ui/avater";
import { useSession } from "next-auth/react";
import { Facebook, Instagram, Sparkle, SwitchCamera } from "lucide-react";

import Button from "./ui/button";
import Link from "next/link";
import Logo from "./logo";
import {
  HomeIcon,
  PenSquare,
  Search,
  Settings2,
  Diamond,
  Bell,
  Store,
} from "lucide-react";
import { api } from "~/utils/api";
import { Mode, useMode } from "~/lib/state/left-side-mode";
import { useRouter } from "next/router";
import Image from "next/image";
import { cn } from "~/lib/wallate/utils";

export const UserNavigation = {
  Home: { path: "/", icon: HomeIcon, text: "HOMEPAGE" },
  // Search: { path: "/search", icon: Search, text: "Search" },
  YourAsset: { path: "/assets", icon: Diamond, text: "FAN ITEMS" },
  Notification: { path: "/notification", icon: Bell, text: "NOTIFICATION" },
  Settings: { path: "/settings", icon: Settings2, text: "SETTINGS" },
} as const;

export const CreatorNavigation = {
  Page: { path: "/me/creator", icon: PenSquare, text: "PAGE" },
  Create: { path: "/posts/creator", icon: PenSquare, text: "CREATE" },
  Store: { path: "/store/creator", icon: Store, text: "STORE" },
  Notification: {
    path: "/notification/creator",
    icon: Bell,
    text: "Notification",
  },
  Settings: { path: "/settings/creator", icon: Settings2, text: "Settings" },
} as const;

export default function LeftBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex w-80 flex-col items-center justify-between overflow-auto bg-base-100/80 px-4 pb-4 pt-10 scrollbar-hide",
        className,
      )}
    >
      <div className="flex w-full flex-1 flex-col items-center gap-2  py-2">
        <div className="mt-7 w-full flex-1">
          <NavigationButtons />
        </div>
      </div>
      <div className="flex w-full flex-col items-center py-4">
        <LeftBottom />
      </div>
    </div>
  );
}

function NavigationButtons() {
  const { selectedMenu, toggleSelectedMenu } = useMode();

  function getNavigation() {
    if (selectedMenu == Mode.Creator) return CreatorNavigation;
    else return UserNavigation;
  }

  return (
    <div className="flex h-full w-full flex-col items-start gap-2 ">
      {Object.entries(getNavigation()).map(
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
      <Profile />
    </div>
  );
}

function ProfileComponent({
  avaterUrl,
  handleModeChange,
  name,
  mode,
}: {
  avaterUrl: string | null;
  handleModeChange: () => void;
  name: string | null;
  mode: Mode;
}) {
  return (
    <div
      className="btn btn-ghost btn-active w-full  items-center  gap-x-4 "
      onClick={handleModeChange}
    >
      <SwitchCamera />
      <p className="">Switch to {mode}</p>
      <Sparkle />
    </div>
  );
}

function UserAvater() {
  const router = useRouter();
  const { setSelectedMenu } = useMode();
  const user = api.user.getUser.useQuery();
  const handleClick = () => {
    setSelectedMenu(Mode.Creator);
    router.push("/me/creator");
  };
  if (user.data) {
    return (
      <ProfileComponent
        handleModeChange={handleClick}
        avaterUrl={user.data.image}
        mode={Mode.Creator}
        name={user.data.name}
      />
    );
  }
}
function CreatorAvater() {
  const router = useRouter();
  const { setSelectedMenu } = useMode();
  const creator = api.creator.meCreator.useQuery();

  const handleClick = () => {
    setSelectedMenu(Mode.User);
    router.push("/");
  };

  return (
    <ProfileComponent
      handleModeChange={handleClick}
      avaterUrl={creator?.data?.profileUrl ?? null}
      mode={Mode.User}
      name={creator?.data?.name ?? "Unknown"}
    />
  );
}

function Profile() {
  const { isAva } = useConnectWalletStateStore();
  const { selectedMenu, getAnotherMenu, toggleSelectedMenu } = useMode();

  const creator = api.creator.meCreator.useQuery();

  if (isAva) {
    if (selectedMenu == Mode.User) {
      return <UserAvater />;
    } else return <CreatorAvater />;
  }
}

function LeftBottom() {
  return (
    <div className="flex w-full flex-col justify-center gap-1">
      <Link href="https://bandcoin.io" className="btn">
        WALLET
      </Link>
      <Link href="https://music.bandcoin.io" className="btn">
        MUSIC
      </Link>
      <Link href="https://music.bandcoin.io/marketplace" className="btn">
        MARKETPLACE
      </Link>
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
          href={"https://twitter.com/WadzzoApp"}
          className="btn flex h-16 flex-1 flex-col items-center text-xs normal-case "
          target="_blank"
        >
          <Image src="/images/icons/x.svg" alt="X" height={18} width={18} />
          <span>X</span>
        </Link>
        <Link
          href={"https://instagram.com/wadzzo/"}
          className="btn flex h-16 flex-col items-center text-xs normal-case"
          target="_blank"
        >
          <Instagram />
          <span>Instagram</span>
        </Link>
      </div>
      <div className="flex w-full flex-col text-center text-xs text-base-content">
        <p>© 2023 bandcoin.io</p>
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
