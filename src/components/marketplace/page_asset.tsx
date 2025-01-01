'use client'
import { CreatorPageAsset } from "@prisma/client";
import { useRouter, usePathname } from "next/navigation"; // Changed to next/navigation
import { useEffect } from "react";
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
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const newPath = `/fans/creator/${item.creatorId}`;

    // Only navigate if we're actually changing paths
    if (pathname !== newPath) {
      router.push(newPath);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer"
      role="button"
      tabIndex={0}

    >
      <AssetView
        code={selectedTag == AssetVariant.Artists ? item?.creator?.name : item.code}
        thumbnail={item.thumbnail ?? item?.creator?.profileUrl}
      />
    </div>
  );
}

export default PageAssetComponent;