import React from "react";
import PlaceMarketModal from "~/components/marketplace/modal/place_market_modal";
import { api } from "~/utils/api";

export default function MyAssetsPage() {
  return (
    <div className="p-5">
      <h1 className="mb-2 text-2xl font-bold">FAN ITEMS</h1>
      <MyAssets />
      <MyStorageAsset />
    </div>
  );
}

function MyStorageAsset() {
  const acc = api.wallate.acc.getCreatorStorageInfo.useQuery();

  if (acc.isLoading) return <span className="loading loading-spinner" />;
  if (acc.data)
    return acc.data.map((asset, i) => {
      return <StorageAsset code={asset.code} issuer={asset.issuer} />;
    });
}

function StorageAsset({ code, issuer }: { code: string; issuer: string }) {
  const toggleVisibility =
    api.marketplace.market.toggleVisibilityMarketNft.useMutation();
  const isInMarket = api.wallate.acc.isItemPlacedInMarket.useQuery({
    code,
    issuer,
  });
  return (
    <div className="grid grid-cols-1 gap-4 bg-blue-200 md:grid-cols-2 lg:grid-cols-3">
      <p>{code}</p>
      {isInMarket.isLoading && (
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            toggleVisibility.mutate({
              id: 1,
              visibility: false,
            });
          }}
        >
          {toggleVisibility.isLoading && (
            <span className="loading loading-spinner" />
          )}
          Enable
        </button>
      )}
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
            issuer={asset.issuer}
            code={asset.code}
            name={asset.copies.toString()}
            description={asset.homeDomain}
            key={i}
          />
        </div>
      );
    });
}

function AssetItemComponent({
  name,
  description,
  code,
  issuer,
}: {
  name: string;
  description: string;
  code: string;
  issuer: string;
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
          {/* <RevertPlaceMarketModal /> */}
          <PlaceMarketModal item={{ code, copies: 10, issuer }} />
        </div>
      </div>
    </div>
  );
}
