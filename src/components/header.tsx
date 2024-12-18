import React from "react";

import Hamburger from "./hamburger";
import Logo from "./logo";
import { SiteAssetBalance } from "./marketplace/recharge/site_asset_bal";

import Image from "next/image";

interface HeaderProps {
  key?: React.Key;
}

function Header(_props: HeaderProps) {
  return (
    <header className="h-20 bg-base-100/20 px-2 py-4 md:px-6">
      <div className="flex w-full items-center justify-between xl:hidden">
        <div className={"flex items-center gap-2"}>
          <Hamburger />
          <Logo />
        </div>
        {/* <ConnectWalletButton /> */}
        <SiteAssetBalance />
      </div>
      <div className="hidden xl:flex">
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
      <div className="absolute top-18 left-0 right-0 h-12 overflow-hidden">
        <div className="christmas-lights">
          <div className="light-string">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="light-segment">
                <div className="wire"></div>
                <div
                  className="bulb"
                  style={{
                    backgroundColor: i % 3 === 0 ? '#ff0000' :
                      i % 3 === 1 ? '#00ff00' :
                        '#ffff00',
                    animationDelay: `${i * 0.1}s`
                  }}
                ></div>
              </div>
            ))}
          </div>
          <div className="light-string2">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="light-segment2">
                <div className="wire2"></div>
                <div
                  className="bulb2"
                  style={{
                    backgroundColor: i % 3 === 0 ? '#ffff00' :
                      i % 3 === 1 ? '#ff0000' :
                        '#00ff00',
                    animationDelay: `${i * 0.1}s`
                  }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </div>



    </header>
  );
}

export default Header;
