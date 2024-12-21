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
          <div className="lg:hidden">
            <Hamburger />
          </div>
          <Logo className="self hidden sm:flex" />
        </div>
        <div className="self-end  md:hidden">
          {/* <ConnectWalletButton  /> */}

          <SiteAssetBalance />
        </div>
        <div className="ml-auto hidden md:flex">
          <SiteAssetBalance />
        </div>
      </div>
      <div className="absolute top-[4.6rem] left-0 right-0 w-full z-50 flex overflow-hidden">
        {Array.from({ length: 5 }, (_, index) => (
          <Image
            key={index}
            src="/trn-christmas-lights.png"
            alt=""
            width={1000}
            height={1000}
            className="object-cover"
            priority={index === 0}
          />
        ))}
      </div>
      <Image
        src="/candy-cane.png"
        alt="Candy Cane"
        width={40}
        height={80}
        className="absolute z-10 left-4 top-[4rem] transform -rotate-45 "
      />
      <Image
        src="/candy-cane.png"
        alt="Candy Cane"
        width={40}
        height={80}
        className="absolute z-10 right-4 top-[4rem] transform rotate-45  "
      />
      <Image
        src="/christmas-tree.png"
        alt="Christmas Tree"
        width={60}
        height={80}
        className="h-16 w-10 absolute left-1/4 transform -translate-x-1/2 top-[1rem]  hidden md:flex"
      />
      <Image
        src="/christmas-tree.png"
        alt="Christmas Tree"
        width={60}
        height={80}
        className="h-16 w-10 absolute right-1/3 transform -translate-x-1/2 top-[1rem] hidden md:flex"
      />
    </header>
  );
}

export default Header;
