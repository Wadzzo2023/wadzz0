import React from "react";
import LeftBar from "./left-sidebar";
import RightBar from "./right-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <LeftBar />
      <div className="scrollbar-hide h-screen flex-1 overflow-y-auto">
        {children}
      </div>
      <RightBar />
    </div>
  );
}
