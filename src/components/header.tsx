import React from "react";
// import Hamburger from "./hamburger";
import { ConnectWalletButton } from "package/connect_wallet";

import Logo from "./logo";
import { Hammer } from "lucide-react";
import { MobileHeaderAvater } from "./mobile/top-nav";

interface HeaderProps {
  key?: React.Key;
}

function Header(_props: HeaderProps) {
  return (
    <header className="h-20 bg-base-100/20 px-2 py-4">
      <div
        className={"flex items-center justify-between gap-2  sm:justify-center"}
      >
        <Logo />
        <div className="self-end sm:hidden">
          <MobileHeaderAvater />
        </div>
      </div>
    </header>
  );
}

export default Header;
