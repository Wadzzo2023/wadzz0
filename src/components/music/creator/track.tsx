import clsx from "clsx";
import Image from "next/image";
import { Button } from "~/components/shadcn/ui/button";
import { TrackItemType, usePlayerStore } from "~/lib/state/music/track";
import BuyModal from "../modal/buy_modal";
import { AssetType } from "~/components/marketplace/market_right";
import { ReactNode } from "react";

function CreatorTrack({
  item,
  assetItem,
  playable,
  buyModal,
}: {
  item: TrackItemType;
  assetItem?: AssetType;
  playable?: boolean;
  buyModal?: ReactNode;
}) {
  const trackUrlStore = usePlayerStore();

  function playSong() {
    if (playable) trackUrlStore.setNewTrack(item);
  }
  return (
    <div
      // onClick={playSong}
      className="flex max-w-md flex-row items-center   justify-between p-2 hover:bg-base-100"
      //   onClick={}
    >
      <div className="flex">
        <div className="bg-neutral-focus mr-4 h-10 w-10 flex-shrink-0">
          <Image
            src={item.thumbnail}
            width={40}
            height={40}
            alt="music cover"
          />
        </div>
        <div className="">
          <p className={clsx(" text-base font-bold")}>{item.code}</p>
          <p className={clsx("text-sm")}>{item.artist}</p>
        </div>
      </div>
      <div>
        {playable ? (
          <Button onClick={playSong}>Play</Button>
        ) : (
          // <Button>Buy</Button>

          <>{buyModal}</>
        )}
      </div>
    </div>
  );
}

export default CreatorTrack;
