import React from "react";
import { ChevronLeft } from "lucide-react";
import { RightComponent } from "./right-sidebar";
export default function Drawer() {
  return (
    <div className="drawer drawer-end">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content">
        {/* Page content here */}
        <label
          htmlFor="my-drawer"
          className="btn btn-circle drawer-button  bg-base-300"
        >
          <ChevronLeft />
        </label>
      </div>
      <div className="drawer-side">
        <label
          htmlFor="my-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <ul className="h-full w-80 flex-col bg-base-200">
          <RightComponent />
        </ul>
      </div>
    </div>
  );
}
