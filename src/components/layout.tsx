import React from "react";
import LeftBar from "./left-sidebar";
import RightBar from "./right-sidebar";
import BottomNav from "./mobile/bottom-nav";
import TopNav from "./mobile/top-nav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <LeftBar />
      <div className="h-screen flex-1 overflow-y-auto  scrollbar-hide">
        <TopNav />
        {children}
        <BottomNav />
      </div>
      <RightBar />
    </div>
  );
}
