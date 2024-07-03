import React from "react";

import Hamburger from "./hamburger";
import Logo from "./logo";
import { SiteAssetBalance } from "./marketplace/recharge/site_asset_bal";

import Image from "next/image";
import { ConnectWalletButton } from "package/connect_wallet";

interface HeaderProps {
  key?: React.Key;
}

function Header(_props: HeaderProps) {
  return (
    <header className="h-20 bg-base-100/20 px-2 py-4">
      <div
        className={"flex items-center justify-between gap-2 md:justify-center "}
      >
        <div className="flex ">
          <div className="md:hidden">
            <Hamburger />
          </div>
          <Logo className="self hidden sm:flex" />
        </div>
        <div className="self-end  md:hidden">
          <ConnectWalletButton />
        </div>
        <div className="ml-auto hidden md:flex">
          <SiteAssetBalance />
        </div>
      </div>
    </header>
  );
}

export default Header;
