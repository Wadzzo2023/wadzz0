import { CreatorPageAsset } from "@prisma/client";
import { useRouter } from "next/router";
import { usePopUpState } from "~/lib/state/right-pop";
import { usePageAssetRightStore } from "~/lib/state/wallete/page_asset_right";
import { useTagStore } from "~/lib/state/wallete/tag";
import { AssetVariant } from "../right-sidebar";
import AssetView from "./asset/asset_view";

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
  const router = useRouter();
  return (
    <div>
      <button
        onClick={async () => {
          await router.push(`/fans/creator/${item.creatorId}`);
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
