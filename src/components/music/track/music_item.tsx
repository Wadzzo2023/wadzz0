import { Song } from "@prisma/client";
import clsx from "clsx";
import Image from "next/image";
import { AssetType } from "~/components/marketplace/market_right";
import { usePlayerStore } from "~/lib/state/music/track";
import { PlayOrBuy } from "../album/table";
import { AssetBadge } from "./asset_badge";
import { PlayIcon } from "lucide-react";

export type SongItemType = Song & { asset: AssetType };

export default function MusicItem({
  item,
  playable,
  index,
}: {
  item: SongItemType;
  playable?: boolean;
  index: number;
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
      className="group cursor-pointer space-y-2"
      onClick={playSong}
    >
      <div className="relative aspect-square overflow-hidden rounded-md shadow-md">
        <Image
          src={item.asset.thumbnail}
          layout="fill"
          objectFit="cover"
          alt={`${item.asset.code} cover`}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-0 transition-all duration-300 group-hover:bg-opacity-50">
          <PlayIcon className="h-12 w-12 text-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      </div>
      <div>
        <p className="text-base font-medium text-gray-800 line-clamp-1">{item.asset.code}</p>
        <p className="text-sm text-gray-600 line-clamp-1">{item.artist}</p>
      </div>
    </div>
  );
}
