import clsx from "clsx";
import React from "react";
import { AssetMenu, useAssetMenu } from "~/lib/state/user-asset-menu";

export default function MyAssetsPage() {
  return (
    <div className="p-5">
      <h1 className="mb-2 text-center text-3xl font-bold">My Assets Page</h1>
      <div className="flex flex-col items-center">
        <CreateTabs />
      </div>
    </div>
  );
}

function RenderTabs() {
  const { setSelectedMenu, selectedMenu } = useAssetMenu();
  switch (selectedMenu) {
    case AssetMenu.SubscriptionAsset:
      return <div>subscriptons</div>;
    case AssetMenu.Assets:
      return <div>Assets</div>;
  }
}

function CreateTabs() {
  const { setSelectedMenu, selectedMenu } = useAssetMenu();
  return (
    <div role="tablist" className="tabs tabs-bordered">
      {Object.values(AssetMenu).map((key) => {
        return (
          <a
            key={key}
            onClick={() => setSelectedMenu(key)}
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
