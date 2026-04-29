import { getTailwindScreenSize } from "~/utils/clientUtils";
import { useMarketRightStore } from "~/lib/state/marketplace/right";
import AssetView from "./asset/asset_view";
import { usePopUpState } from "~/lib/state/right-pop";
import { MarketType } from "@prisma/client";
import { MarketAssetType, useModal } from "~/lib/state/play/use-modal-store";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";

function MarketAssetComponent({ item }: { item: MarketAssetType }) {
  const { asset } = item;
  const { onOpen } = useModal()
  const urs = useMarketRightStore();
  const pop = usePopUpState();
  return (
    <div className=""
      onClick={() => {
        onOpen("buy modal", {
          Asset: item
        });

      }}>

      <AssetView
        code={asset.name}
        thumbnail={asset.thumbnail}
        priceText={`${item.price.toFixed(2)} ${PLATFORM_ASSET.code.toUpperCase()}`}
        subPriceText={`~$${item.priceUSD.toFixed(2)}`}
        actionLabel="View Details"
        onAction={() => {
          onOpen("buy modal", {
            Asset: item,
          });
        }}
      />

    </div>
  );
}

export default MarketAssetComponent;
