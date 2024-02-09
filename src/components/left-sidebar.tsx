import { ConnectWalletButton } from "package/connect_wallet";
import React from "react";
import Avater from "./ui/avater";
import { useSession } from "next-auth/react";
import Button from "./ui/button";
import Link from "next/link";
import Logo from "./logo";
import { HomeIcon, PenSquare, Search, Settings2, Bell } from "lucide-react";
import { api } from "~/utils/api";
import { Mode, useMode } from "~/lib/state/left-side-mode";

const UserNavigation = {
  Home: { path: "/", icon: HomeIcon, text: "Home" },
  Search: { path: "/search", icon: Search, text: "Search" },
  Notification: { path: "/notification", icon: Bell, text: "Notification" },
  Settings: { path: "/settings", icon: Settings2, text: "Settings" },
} as const;

const CreatorNavigation = {
  Page: { path: "/me/creator", icon: PenSquare, text: "Page" },
  Notification: { path: "/notification", icon: Bell, text: "Notification" },
  Settings: { path: "/settings", icon: Settings2, text: "Settings" },
} as const;

export default function LeftBar() {
  return (
    <div className="flex h-screen w-80 flex-col items-center justify-between gap-2 bg-base-300  py-5">
      <Logo />
      <div className="w-2/3 flex-1">
        <NavigationButtons />
      </div>
      <div className="flex flex-col justify-center">
        <Profile />
        <ConnectWalletButton />
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
    <div className="flex h-full w-full flex-col items-start justify-center gap-2 ">
      {Object.entries(getNavigation()).map(
        ([key, { path, icon: Icon, text }]) => (
          <Link href={path} className="w-full">
            <Button
              path={path}
              icon={<Icon className="h-5 w-5" />}
              text={text}
            />
          </Link>
        ),
      )}
    </div>
  );
}

function Profile() {
  const user = api.user.getUser.useQuery();
  const { getAnotherMenu, toggleSelectedMenu } = useMode();
  if (user.data)
    return (
      <div
        className="btn my-2 items-center  justify-start gap-2"
        onClick={() => toggleSelectedMenu()}
      >
        <Avater url={user.data.image} />
        <div className="flex flex-col items-start">
          <p className="">{user.data.name}</p>
          <p>Switch to {getAnotherMenu()}</p>
        </div>
      </div>
    );
}
