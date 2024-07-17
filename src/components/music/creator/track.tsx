import Image from "next/image";
import clsx from "clsx";
import { AssetBadge } from "../track/asset_badge";
import { TrackItemType, usePlayerStore } from "~/lib/state/music/track";
import { Button } from "~/components/shadcn/ui/button";

function CreatorTrack({
  item,
  everyone,
}: {
  item: TrackItemType;
  everyone?: boolean;
}) {
  const trackUrlStore = usePlayerStore();

  function playSong() {
    if (everyone) trackUrlStore.setNewTrack(item);
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
        <Button onClick={playSong}>Play</Button>

        {/* <AssetBadge asset={{ code: "vong", issuer: "cong" }} /> */}
      </div>
    </div>
  );
}

export default CreatorTrack;
