import React from "react";
import LeftBar from "./left-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <LeftBar />
      {children}
    </div>
  );
}
