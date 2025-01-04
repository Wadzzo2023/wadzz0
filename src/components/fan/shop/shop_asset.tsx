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
    <div
      className=""
      onClick={() => {
        onOpen("buy modal", { Asset: item })
      }}>
      <AssetView code={asset.code} thumbnail={asset.thumbnail}

      />
    </div>
  );
}

export default ShopAssetComponent;
