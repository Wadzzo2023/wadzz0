import clsx from "clsx";
import React from "react";
import { CreatorMenu, useCreator } from "~/lib/state/creator-menu";

export default function Tabs() {
  const { selectedMenu, setSelectedMenu } = useCreator();
  return (
    <div role="tablist" className="tabs tabs-bordered">
      {Object.keys(CreatorMenu).map((key) => {
        return (
          <a
            onClick={() => setSelectedMenu(key as CreatorMenu)}
            role="tab"
            className={clsx("tab", selectedMenu == key && "tab-active")}
          >
            {key}
          </a>
        );
      })}
    </div>
  );
}
