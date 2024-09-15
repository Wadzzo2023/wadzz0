import { getTailwindScreenSize } from "~/utils/clientUtils";
import { MarketAssetType } from "./market_right";
import { useMarketRightStore } from "~/lib/state/marketplace/right";
import AssetView from "./asset/asset_view";
import { usePopUpState } from "~/lib/state/right-pop";
import { MarketType } from "@prisma/client";

function MarketAssetComponent({ item }: { item: MarketAssetType }) {
  const { asset } = item;

  const urs = useMarketRightStore();
  const pop = usePopUpState();
  return (
    <div className="">
      <button
        onClick={() => {
          urs.setData(item);
          pop.setType(MarketType.ADMIN);

          if (!getTailwindScreenSize().includes("xl")) {
            pop.setOpen(true);
          }
        }}
        className="btn relative h-fit w-full  overflow-hidden py-4 hover:bg-green-300/50"
      >
        <AssetView code={asset.name} thumbnail={asset.thumbnail} />
      </button>
    </div>
  );
}

export default MarketAssetComponent;
