import React from "react";
import LeftBar from "./left-sidebar";
import RightBar from "./right-sidebar";
import BottomNav from "./mobile/bottom-nav";
import TopNav from "./mobile/top-nav";
import {
  ConnectWalletButton,
  useConnectWalletStateStore,
} from "package/connect_wallet";
import { useSession } from "next-auth/react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data } = useSession();
  return (
    <div className="flex">
      <LeftBar />
      <div className="h-screen flex-1  overflow-y-auto scrollbar-hide">
        <TopNav />
        {data?.user.id ? (
          <>{children}</>
        ) : (
          <div className="flex h-full items-center justify-center">
            <ConnectWalletButton />
          </div>
        )}
        <BottomNav />
      </div>
      <RightBar />
    </div>
  );
}
