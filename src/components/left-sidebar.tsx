import { ConnectWalletButton } from "package/connect_wallet";
import React from "react";
import Avater from "./ui/avater";
import { useSession } from "next-auth/react";
import Button from "./ui/button";
import Link from "next/link";

export default function LeftBar() {
  return (
    <div className="flex h-screen w-80 flex-col items-center justify-between gap-2 bg-base-300">
      <div className="flex-1">
        <Link href={"/me/creator"}>
          <Button text="Cretor" />
        </Link>
        <Profile />
      </div>
      <div className="flex justify-center">
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
