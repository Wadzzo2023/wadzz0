import { Creator, CreatorPageAsset } from "@prisma/client";
import { useRouter } from "next/router";
import { usePopUpState } from "~/lib/state/right-pop";
import { usePageAssetRightStore } from "~/lib/state/wallete/page_asset_right";
import { useTagStore } from "~/lib/state/wallete/tag";
import { AssetVariant } from "../right-sidebar";
import AssetView from "./asset/asset_view";

export type CreatorPageAssetType = {
  name: string;
  id: string;
  profileUrl: string | null;
  pageAsset: {
    code: string;
    limit: number;
    issuer: string;
    creatorId: string;
    issuerPrivate: string | null;
    thumbnail: string | null;
  } | null;
}

function PageAssetComponent({ item }: { item: CreatorPageAssetType }) {
  const { selectedTag } = useTagStore();
  const router = useRouter();
  return (
    <div onClick={async () => {
      await router.push(`/fans/creator/${item.id}`);
    }}>

      <AssetView
        code={
          item.name
        }
        thumbnail={item.profileUrl}
        isNFT={false}
      />

    </div>
  );
}

export default PageAssetComponent;
