import clsx from "clsx";
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "~/components/shadcn/ui/tabs";
import { CreatorMenu, useCreator } from "~/lib/state/fan/creator-menu";

export default function CreatorsTabs() {
  const { selectedMenu, setSelectedMenu } = useCreator();
  const menuItems = Object.values(CreatorMenu);
  const gridColsClass = menuItems.length === 1 ? "grid-cols-1" : "grid-cols-2";

  return (
    <Tabs defaultValue={menuItems[0]} className="">
      <TabsList className={clsx("grid w-full", gridColsClass)}>
        {menuItems.map((key) => (
          <TabsTrigger
            value={key}
            key={key}
            onClick={() => setSelectedMenu(key)}
            role="tab"
            className={clsx(
              selectedMenu === key && "tab-active text-primary",
              "font-bold",
            )}
          >
            {key}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
