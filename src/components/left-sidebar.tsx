import { ConnectWalletButton } from "package/connect_wallet";
import React from "react";
import Avater from "./ui/avater";
import { useSession } from "next-auth/react";
import Button from "./ui/button";
import Link from "next/link";
import Logo from "./logo";
import { HomeIcon, PenSquare, Search, Settings2 } from "lucide-react";

const Navigation = {
  Home: { path: "/", icon: HomeIcon, text: "Home" },
  Search: { path: "/search", icon: Search, text: "Search" },
  Creator: { path: "/me/creator", icon: PenSquare, text: "Creator" },
  Settings: { path: "/settings", icon: Settings2, text: "Settings" },
} as const;

export default function LeftBar() {
  return (
    <div className="flex h-screen w-80 flex-col items-center justify-between gap-2 bg-base-300  py-5">
      <Logo />
      <div className="w-2/3 flex-1">
        <div className="flex h-full w-full flex-col items-start justify-center gap-2 ">
          {Object.entries(Navigation).map(
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
      </div>
      <div className="flex flex-col justify-center">
        <Profile />
        <ConnectWalletButton />
      </div>
    </div>
  );
}

function Profile() {
  const { data: sessionData } = useSession();
  if (sessionData)
    return (
      <div className="flex items-center justify-center gap-2">
        <Avater />
        <p>{sessionData.user.name}</p>
      </div>
    );
}
