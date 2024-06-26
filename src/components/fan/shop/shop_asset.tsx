import { getTailwindScreenSize } from "~/utils/clientUtils";
import { useMarketRightStore } from "~/lib/state/marketplace/right";
import { usePopUpState } from "~/lib/state/right-pop";
import { MarketType } from "@prisma/client";
import AssetView from "~/components/marketplace/asset/asset_view";
import { MarketAssetType } from "~/components/marketplace/market_right";

function ShopAssetComponent({ item }: { item: MarketAssetType }) {
  const { asset } = item;

  const urs = useMarketRightStore();
  const pop = usePopUpState();
  return (
    <div>
      <button className="btn relative h-fit w-full overflow-hidden  py-4 ">
        <AssetView code={asset.code} thumbnail={asset.thumbnail} />
      </button>
    </div>
  );
}

export default ShopAssetComponent;
