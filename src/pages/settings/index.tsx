import clsx from "clsx";
import React from "react";
import { SettingsMenu, useSettingsMenu } from "~/lib/state/settings-menu";
import { useSession } from "next-auth/react";
import About from "~/components/me/user-profile";
import Memberships from "~/components/me/memberships";

export default function Settings() {
  const { data } = useSession();
  if (data?.user)
    return (
      <div className="p-4">
        <h1 className="text-center text-2xl font-bold">Settings</h1>
        <div className="flex flex-col items-center gap-4 pb-20">
          <SettingsTabs />
          <RenderTabs />
        </div>
      </div>
    );
}

function RenderTabs() {
  const { selectedMenu, setSelectedMenu } = useSettingsMenu();
  switch (selectedMenu) {
    case SettingsMenu.Basic:
      return <About />;
    case SettingsMenu.Membership:
      return <Memberships />;
  }
}

function SettingsTabs() {
  const { selectedMenu, setSelectedMenu } = useSettingsMenu();
  return (
    <div role="tablist" className="tabs-boxed tabs mt-10">
      {Object.values(SettingsMenu).map((key) => {
        return (
          <a
            key={key}
            onClick={() => setSelectedMenu(key)}
            role="tab"
            className={clsx(
              "tab",
              selectedMenu == key && "tab-active text-primary",
              "font-bold",
            )}
          >
            {key}
          </a>
        );
      })}
    </div>
  );
}
