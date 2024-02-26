import React from "react";
import { getTailwindScreenSize } from "~/lib/clientUtils";
import type { AssetType } from "~/lib/interfaces";
import { useRightStore } from "~/lib/states/right";
import ImageVideViewer from "../Image_video_viewer";
import { Highlight } from "../search/Highlight";
import type { AssetTypeHit } from "~/lib/types/HitTypes";
import { Balance4, useBalanceStore } from "~/lib/states/storageAcc";
import { NFT } from "~/lib/types/dbTypes";
import { NAVIGATION, useOpenStore } from "~/lib/states/open";
import { MarketNFT } from "~/server/api/routers/marketplace";

interface AssetProps {
  item: NFT;
}

function NftItem({ item }: AssetProps) {
  const { name: code, thumbnailUrl } = item;
  const urs = useRightStore();
  const { navPath } = useOpenStore();

  const copies = useBalanceStore((state) =>
    state.getAssetBalance({
      code: item.nftAsset?.code,
      issuer: item.nftAsset?.issuer.pub,
      limit: true,
      for: Balance4.USER,
    }),
  );

  return (
    <div>
      <button
        onClick={() => {
          urs.setRightData(item as MarketNFT);
          if (!getTailwindScreenSize().includes("xl")) {
            urs.setOpen(true);
          }
          if (navPath == NAVIGATION.MYNFTS) {
            const updatedItem = item as MarketNFT;
            updatedItem.copies = Number(copies);
            updatedItem.path = "/";
            urs.setRightData(updatedItem);
          }
        }}
        className="btn relative h-fit w-full overflow-hidden  py-4 "
      >
        <div
          className="absolute h-full w-full opacity-30"
          style={{
            backgroundColor: "blue",
          }}
        />
        <div className="flex flex-col space-y-2 ">
          <div className="avatar ">
            <div className="relative w-24 rounded-full">
              <ImageVideViewer
                blurData={thumbnailUrl}
                code={code}
                url={thumbnailUrl}
                sizes="100px"
              />
            </div>
            <p className="absolute right-0 top-0">
              {navPath == NAVIGATION.MYNFTS ? copies : item.copies}
            </p>
          </div>
          <p>
            {/* <Highlight hit={nft as AssetTypeHit} attribute="code" /> */}
            {/* user have:{copies} */}
            {item.nftAsset.code}
          </p>
        </div>
      </button>
    </div>
  );
}

export default NftItem;
