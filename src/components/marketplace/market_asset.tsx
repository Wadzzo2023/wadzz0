import { getTailwindScreenSize } from "~/utils/clientUtils";
import { useMarketRightStore } from "~/lib/state/marketplace/right";
import AssetView from "./asset/asset_view";
import { usePopUpState } from "~/lib/state/right-pop";
import { MarketType } from "@prisma/client";
import { MarketAssetType, useModal } from "~/lib/state/play/use-modal-store";

function MarketAssetComponent({ item }: { item: MarketAssetType }) {
  const { asset } = item;
  const { onOpen } = useModal()
  const urs = useMarketRightStore();
  const pop = usePopUpState();
  return (
    <div className="">
      <button
        onClick={() => {
          onOpen("buy modal", {
            Asset: item
          });

        }}
        className="btn relative h-fit w-full  overflow-hidden py-4 hover:bg-green-300/50"
      >
        <AssetView code={asset.name} thumbnail={asset.thumbnail} />
      </button>
    </div>
  );
}

export default MarketAssetComponent;
