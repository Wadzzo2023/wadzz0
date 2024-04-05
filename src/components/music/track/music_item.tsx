import Image from "next/image";
import Link from "next/link";
import { AssetBadge } from "./asset_badge";
import { PlayCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "~/lib/state/music/track";
import clsx from "clsx";
import { Song } from "@prisma/client";
import toast from "react-hot-toast";
import { AssetType } from "~/components/marketplace/market_right";

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
    if (playable) trackUrlStore.setNewTrack(item);
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
          <Link href={`/music/track/${item.id}`}>
            <p className={clsx(" text-base font-bold")}>{item.asset.code}</p>
          </Link>
          <p className={clsx("text-sm")}>{item.artist}</p>
        </div>
      </div>
      <div>
        <AssetBadge asset={{ code: "vong", issuer: "cong" }} />
      </div>
    </div>
  );
}
