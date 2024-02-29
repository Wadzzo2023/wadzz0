import clsx from "clsx";
import React from "react";
import { AssetMenu, useAssetMenu } from "~/lib/state/fan/user-asset-menu";
import { api } from "~/utils/api";

export default function MyAssetsPage() {
  return (
    <div className="p-5">
      <h1 className="mb-2 text-2xl font-bold">FAN ITEMS</h1>
      <MyAssets />
    </div>
  );
}

function MyAssets() {
  const acc = api.wallate.acc.getAccountInfo.useQuery();
  if (acc.isLoading) return <span className="loading loading-spinner" />;
  if (acc.data)
    return acc.data.map((asset, i) => {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AssetItemComponent
            code={asset.code}
            name={asset.copies.toString()}
            description={asset.homeDomain}
            key={i}
          />
        </div>
      );
    });
}

function RenderTabs() {
  const { setSelectedMenu, selectedMenu } = useAssetMenu();
  switch (selectedMenu) {
    case AssetMenu.SubscriptionAsset:
      return <SubscriptionAsset />;
    case AssetMenu.Assets:
      return <ShopAsset />;
  }
}

function ShopAsset() {
  const assets = api.shop.getUserShopAsset.useQuery();

  if (assets.data && assets.data.length > 0) {
    <div>
      {assets.data.map((asset) => (
        <AssetItemComponent
          code={asset.shopAsset.asset.code}
          name={asset.shopAsset.name}
          description={asset.shopAsset.description ?? "Shop Asset"}
          key={asset.id}
        />
      ))}
    </div>;
  } else {
    return <p>No asset found</p>;
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
    <div className="card w-96 bg-base-100 shadow-xl">
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
