import React from "react";
import { BottomTab } from "./bottom-tab";

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto h-screen max-w-2xl  bg-slate-200 overflow-hidden">
      <style>{`
        html,
        body {
          background: none !important;
          background-image: none;
        }
      `}</style>
      <BottomTab />
      {children}
    </div>
  );
}
