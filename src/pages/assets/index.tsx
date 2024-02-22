import clsx from "clsx";
import React from "react";
import { AssetMenu, useAssetMenu } from "~/lib/state/user-asset-menu";
import { api } from "~/utils/api";

export default function MyAssetsPage() {
  return (
    <div className="p-5">
      <h1 className="mb-2 text-2xl font-bold">MEMORIES</h1>
      <div className="flex flex-col items-center gap-4">
        <CreateTabs />
        <RenderTabs />
      </div>
    </div>
  );
}

function RenderTabs() {
  const { setSelectedMenu, selectedMenu } = useAssetMenu();
  switch (selectedMenu) {
    case AssetMenu.SubscriptionAsset:
      return <SubscriptionAsset />;
    case AssetMenu.Assets:
      return <div>Assets</div>;
  }
}

function SubscriptionAsset() {
  const subscriptions = api.member.getAllSubscription.useQuery();
  return (
    <div>
      {subscriptions.data?.map((sub) => {
        return (
          <AssetItemComponent
            key={sub.id}
            code={sub.subscription.assetId.toString()}
            description={sub.subscription.features}
            name={sub.subscription.id.toString()}
          />
        );
      })}
    </div>
  );
}

function AssetItemComponent({
  name,
  description,
  code,
}: {
  name: string;
  description: string;
  code: string;
}) {
  return (
    <div className="card w-96 bg-neutral shadow-xl">
      {/* "https://daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg" */}
      {/* {item.mediaUrl && (
        <figure className="relative h-40  w-full">
          <Image
            src={item.mediaUrl}
            layout="fill"
            objectFit="cover"
            alt="Asset"
          />
        </figure>
      )} */}
      <div className="card-body">
        <h2 className="card-title">{name}</h2>
        <p>{description}</p>
        <div className="card-actions justify-end">
          <button className="btn btn-outline btn-primary self-start">
            {code}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateTabs() {
  const { setSelectedMenu, selectedMenu } = useAssetMenu();
  return (
    <div role="tablist" className="tabs-boxed tabs">
      {Object.values(AssetMenu).map((key) => {
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
