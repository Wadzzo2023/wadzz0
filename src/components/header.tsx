import React, { useEffect, useState } from "react";
import Hamburger from "./hamburger";
import Logo from "./logo";
import Lottie from "lottie-react"

import { SiteAssetBalance } from "./marketplace/recharge/site_asset_bal";

import dynamic from "next/dynamic";

const ChristmasSleighAnimation = dynamic(() => import('../components/christmas/ChristmasSleigh'), {
  ssr: false,
});
const ChristmasWindChimeAnimation = dynamic(() => import('../components/christmas/ChristmasWindChimes'), {
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
    <header className="h-20 bg-base-100/20 px-2 py-4 md:px-6 relative">
      <div className="flex w-full items-center justify-between xl:hidden">
        <div className="flex items-center justify-around gap-2 w-full">
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
        {/* <ChristmasSleighAnimation /> */}
        <Logo />
        <SiteAssetBalance />


      </div>

      {/* <div className="absolute top-[3.5rem] left-0 right-0 w-full z-50 flex overflow-hidden  pointer-events-none">
        <div className="flex  h-10 pointer-events-none">
          {Array.from({ length: 20 }, (_, index) => (
            <Image
              key={index}
              src="/tn-christmas-lights.webp"
              alt=""
              width={1000}
              height={1000}
              className="object-cover w-full h-full"
              priority={index === 0}
            />
          ))}
        </div>

      </div>
      <ChristmasWindChimeAnimation /> */}
    </header>
  );
}

export default Header;