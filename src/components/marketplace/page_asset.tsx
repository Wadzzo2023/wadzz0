import { getTailwindScreenSize } from "~/utils/clientUtils";
import { MarketAssetType } from "./market_right";
import { useMarketRightStore } from "~/lib/state/marketplace/right";
import AssetView from "./asset/asset_view";
import { usePopUpState } from "~/lib/state/right-pop";
import { MarketType, CreatorPageAsset } from "@prisma/client";
import { usePageAssetRightStore } from "~/lib/state/wallete/page_asset_right";
import { useTagStore } from "~/lib/state/wallete/tag";
import { AssetVariant } from "../right-sidebar";
export type CreatorPageAssetType = CreatorPageAsset & {
  creator: {
    name: string;
    profileUrl: string | null;
  };
};

function PageAssetComponent({ item }: { item: CreatorPageAssetType }) {
  const { selectedTag } = useTagStore();
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
        <AssetView
          code={
            selectedTag == AssetVariant.Artists
              ? item?.creator?.name
              : item.code
          }
          thumbnail={item.thumbnail ?? item.creator?.profileUrl}
        />
      </button>
    </div>
  );
}

export default PageAssetComponent;
