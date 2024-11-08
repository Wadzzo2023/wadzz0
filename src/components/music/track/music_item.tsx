import { Song } from "@prisma/client";
import clsx from "clsx";
import Image from "next/image";
import { AssetType } from "~/components/marketplace/market_right";
import { usePlayerStore } from "~/lib/state/music/track";
import { PlayOrBuy } from "../album/table";
import { AssetBadge } from "./asset_badge";

export type SongItemType = Song & { asset: AssetType };

export default function MusicItem({
  item,
  playable,
}: {
  item: SongItemType;
  playable?: boolean;
}) {
  const trackUrlStore = usePlayerStore();

  function playSong() {
    if (playable)
      trackUrlStore.setNewTrack({
        artist: item.artist,
        code: item.asset.code,
        thumbnail: item.asset.thumbnail,
        mediaUrl: item.asset.mediaUrl,
        name: item.asset.name,
      });
  }

  return (
    <div
      className="flex max-w-md flex-row items-center   justify-between p-2 hover:bg-base-100"
      onClick={playSong}
    >
      <div className="flex">
        <div className="bg-neutral-focus mr-4 h-10 w-10 flex-shrink-0">
          <Image
            src={item.asset.thumbnail}
            width={40}
            height={40}
            alt="music cover"
          />
        </div>
        <div className="">
          <p className={clsx(" text-base font-bold")}>{item.asset.code}</p>
          <p className={clsx("text-sm")}>{item.artist}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <PlayOrBuy song={item} />
        <AssetBadge
          asset={{ code: item.asset.code, issuer: item.asset.issuer }}
        />
      </div>
    </div>
  );
}
