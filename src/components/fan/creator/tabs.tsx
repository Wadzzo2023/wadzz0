import clsx from "clsx";
import React from "react";
import { CreatorMenu, useCreator } from "~/lib/state/fan/creator-menu";

export default function Tabs() {
  const { selectedMenu, setSelectedMenu } = useCreator();
  return (
    <div role="tablist" className="tabs tabs-lifted">
      {Object.values(CreatorMenu).map((key) => {
        return (
          <a
            key={key}
            onClick={() => setSelectedMenu(key)}
            role="tab"
            className={clsx(
              "tab",
              selectedMenu == key && "tab-active text-primary",
              "text-xl ",
            )}
          >
            {key}
          </a>
        );
      })}
    </div>
  );
}
