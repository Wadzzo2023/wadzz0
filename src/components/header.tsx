import React, { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import Hamburger from "./hamburger";
import Logo from "./logo";
import { SiteAssetBalance } from "./marketplace/recharge/site_asset_bal";

const NewYearAnimation = dynamic(() => import('./NewYearAnimation'), {
  ssr: false,
});
const TextNewYearAnimation = dynamic(() => import('./Text-NewYearAnimation'), {
  ssr: false,
});

import Image from "next/image";

interface HeaderProps {
  key?: React.Key;
}

function Header(_props: HeaderProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  return (
    <header className="h-20 border-b px-2 py-4 md:px-6 sticky w-full top-0 z-50 h-22  bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex w-full items-center justify-between xl:hidden">
        <div className="flex items-center justify-around gap-2 w-full ">
          <Hamburger />
          <Logo />

        </div>

        {/* <ConnectWalletButton /> */}
        <SiteAssetBalance />
      </div>
      <div className="hidden xl:flex items-center gap-4">
        <Image
          className="rounded-box"
          height={100}
          width={100}
          src={"/images/waddzo.gif"}
          alt={process.env.NEXT_PUBLIC_ASSET_CODE?.toString() ?? ""}
        />

        <Logo />
        <SiteAssetBalance />


      </div>


    </header>
  );
}

export default Header;
