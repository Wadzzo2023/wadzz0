import { getTailwindScreenSize } from "~/utils/clientUtils";
import { useMarketRightStore } from "~/lib/state/marketplace/right";
import { usePopUpState } from "~/lib/state/right-pop";
import { MarketType } from "@prisma/client";
import AssetView from "~/components/marketplace/asset/asset_view";
import { MarketAssetType, useModal } from "~/lib/state/play/use-modal-store";

function ShopAssetComponent({ item }: { item: MarketAssetType }) {
  const { asset } = item;
  const { onOpen } = useModal()
  return (
    <div>
      <button
        onClick={() => {
          onOpen("buy modal", { Asset: item })
        }}
        className="btn relative h-fit w-full overflow-hidden  py-4 ">
        <AssetView code={asset.name} thumbnail={asset.thumbnail} />
      </button>
    </div>
  );
}

export default ShopAssetComponent;
