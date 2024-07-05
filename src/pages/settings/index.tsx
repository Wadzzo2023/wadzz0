import clsx from "clsx";
import React from "react";
import { SettingsMenu, useSettingsMenu } from "~/lib/state/fan/settings-menu";
import { useSession } from "next-auth/react";
import About from "~/components/fan/me/user-profile";
import Memberships from "~/components/fan/me/memberships";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/shadcn/ui/tabs";

export default function Settings() {
  const { data } = useSession();
  if (data?.user)
    return (
      <div className="py-4">
        <div className="flex flex-col items-center gap-4 pb-20">
          <SettingsTabs />
          <RenderTabs />
        </div>
      </div>
    );
}

function RenderTabs() {
  const { selectedMenu } = useSettingsMenu();
  switch (selectedMenu) {
    case SettingsMenu.Basic:
      return <About />;
    // case SettingsMenu.Membership:
    //   return <Memberships />;
  }
}

function SettingsTabs() {
  const { selectedMenu, setSelectedMenu } = useSettingsMenu();
  const menuItems = Object.values(SettingsMenu);
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
              "tab",
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
