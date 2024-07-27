import { getTailwindScreenSize } from "~/utils/clientUtils";
import { MarketAssetType } from "./market_right";
import { useMarketRightStore } from "~/lib/state/marketplace/right";
import AssetView from "./asset/asset_view";
import { usePopUpState } from "~/lib/state/right-pop";
import { MarketType, CreatorPageAsset } from "@prisma/client";
import { usePageAssetRightStore } from "~/lib/state/wallete/page_asset_right";

function PageAssetComponent({ item }: { item: CreatorPageAsset }) {
  const urs = usePageAssetRightStore();
  const pop = usePopUpState();
  console.log(item);
  return (
    <div>
      <button
        onClick={() => {
          urs.setData(item);
          pop.setType("Assets");

          if (!getTailwindScreenSize().includes("xl")) {
            pop.setOpen(true);
          }
        }}
        className="btn relative h-fit w-full overflow-hidden  py-4 "
      >
        <AssetView code={item.code} thumbnail={item.thumbnail} />
      </button>
    </div>
  );
}

export default PageAssetComponent;
