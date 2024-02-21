import React from "react";
// import Hamburger from "./hamburger";
import { ConnectWalletButton } from "package/connect_wallet";

import Logo from "./logo";
import { Hammer } from "lucide-react";

interface HeaderProps {
  key?: React.Key;
}

function Header(_props: HeaderProps) {
  return (
    <header className="h-20 bg-base-100/20 px-2 py-4">
      <div className="flex w-full items-start justify-center  xl:hidden">
        <div className={"flex items-center justify-center gap-2"}>
          {/* <Hamburger /> */}
          {/* <Hammer /> */}
          <Logo />
        </div>
        {/* <ConnectWalletButton /> */}
      </div>
      <div className="hidden justify-center xl:flex">
        <Logo />
      </div>
    </header>
  );
}

export default Header;
