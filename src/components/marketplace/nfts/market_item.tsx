import React from "react";
import { getTailwindScreenSize } from "~/lib/marketplace/clientUtils";
import { useRightStore } from "~/lib/state/marketplace/right";
import clsx from "clsx";
import ImageVideViewer from "~/components/wallete/Image_video_viewer";
import { MarketNFT } from "~/server/api/routers/marketplace/marketplace";

interface AssetProps {
  item: MarketNFT;
}

function MarketItem({ item }: AssetProps) {
  const { name: code, thumbnailUrl } = item;
  const { setRightData, setOpen } = useRightStore();
  // const copies = useBalanceStore((state) =>
  //   state.getAssetBalance({
  //     code: nft.nftAsset?.code,
  //     issuer: nft.nftAsset?.issuer.pub,
  //     limit: true,
  //     for: Balance4.STORAGE,
  //   }),
  // );

  return (
    <div
      className={clsx(
        item.original && "glaze-border rounded-xl border-4 border-red-600",
      )}
    >
      <button
        onClick={() => {
          setRightData(item);
          if (!getTailwindScreenSize().includes("xl")) {
            setOpen(true);
          }
        }}
        className="btn relative h-fit min-h-full w-full overflow-hidden py-4 "
      >
        <div
          className={clsx("absolute h-full w-full", "opacity-30")}
          style={{
            backgroundColor: item.original ? "blue" : "green",
          }}
        />
        <div className=" flex flex-col">
          <div className="avatar">
            <div className="relative max-h-40 w-24 rounded-full">
              <ImageVideViewer
                blurData={thumbnailUrl}
                code={code}
                url={thumbnailUrl}
                sizes="100px"
              />
            </div>
            <p className="absolute right-0 top-0">{item.copies}</p>
          </div>
          <p>{item.name}</p>
        </div>
      </button>
    </div>
  );
}

export default MarketItem;
