import React from "react";
import LeftBar from "./left-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <LeftBar />
      <div className="h-screen flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
