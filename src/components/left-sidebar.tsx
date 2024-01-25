import { ConnectWalletButton } from "package/connect_wallet";
import React from "react";
import Avater from "./ui/avater";
import { useSession } from "next-auth/react";
import Button from "./ui/button";
import Link from "next/link";
import Logo from "./logo";

export default function LeftBar() {
  return (
    <div className="flex h-screen w-80 flex-col items-center justify-between gap-2 bg-base-300 py-5">
      <Logo />
      <div className="flex-1">
        <div className="flex h-full flex-col items-center justify-center gap-2">
          <Link href={"/me/creator"}>
            <Button text="Creator" />
          </Link>
          <Link href={"/"}>
            <Button text="Home" />
          </Link>
          <Link href={"/me/creator"}>
            <Button text="Search" />
          </Link>
          <Link href={"/me/creator"}>
            <Button text="Setting" />
          </Link>
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
