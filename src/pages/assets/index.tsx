import AssetView from "~/components/marketplace/asset/asset_view";
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
    <div
      style={{
        scrollbarGutter: "stable",
      }}
      className="main-asset-area"
    >
      {acc.data.map((asset, i) => {
        return (
          <div key={i}>
            <button className="btn relative h-fit w-full overflow-hidden  py-4 ">
              <AssetView code={asset.code} />
            </button>
          </div>
        );
      })}
    </div>;
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
    return (
      <div
        style={{
          scrollbarGutter: "stable",
        }}
        className="main-asset-area"
      >
        {acc.data.map((asset, i) => {
          return (
            <div key={i}>
              <button className="btn relative h-fit w-full overflow-hidden  py-4 ">
                <AssetView code={asset.code} />
              </button>
            </div>
          );
        })}
      </div>
    );
}
