import React from "react";
import Logo from "../../logo";
import Avater from "../../ui/avater";
import { Mode, useMode } from "~/lib/state/fan/left-side-mode";
import { useRouter } from "next/router";
import { ConnectWalletButton } from "package/connect_wallet";
import Link from "next/link";
import { CREATOR_TERM } from "~/utils/term";

export default function TopNav() {
  return (
    <div className="navbar bg-base-300 sm:hidden ">
      <div className="flex-1">
        <Logo />
      </div>
      <MobileHeaderAvater />
    </div>
  );
}
export function MobileHeaderAvater() {
  const router = useRouter();
  const { getAnotherMenu, selectedMenu, setSelectedMenu } = useMode();
  const opMode = getAnotherMenu();

  function toggleMode() {
    if (selectedMenu == Mode.User) {
      router
        .push("/me/creator")
        .then(() => {
          setSelectedMenu(Mode.Creator);
        })
        .catch(console.error);
    }
    if (selectedMenu == Mode.Creator) {
      router
        .push("/")
        .then(() => {
          setSelectedMenu(Mode.User);
        })
        .catch(console.error);
    }
  }
  return (
    <div className="flex-none">
      <div className="dropdown dropdown-end ">
        <div
          tabIndex={0}
          role="button"
          className="avatar btn btn-circle btn-ghost"
        >
          <div className="w-10 rounded-full">
            <Avater className="w-8" />
          </div>
        </div>
        <ul
          tabIndex={0}
          className="menu dropdown-content menu-sm z-[1] mt-3 w-64 rounded-box bg-base-300 p-2 shadow"
        >
          <li onClick={toggleMode}>
            <a className="justify-between">
              Switch To {opMode == Mode.Creator ? CREATOR_TERM : opMode}
            </a>
          </li>

          <li>
            <Link
              href={
                selectedMenu == Mode.Creator ? "/settings/creator" : "/settings"
              }
            >
              Settings
            </Link>
          </li>
          <li className="">
            <ConnectWalletButton />
          </li>
        </ul>
      </div>
    </div>
  );
}
