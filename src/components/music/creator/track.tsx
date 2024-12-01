import Image from "next/image";
import { PlayIcon } from "@heroicons/react/24/solid";
import { TrackItemType, usePlayerStore } from "~/lib/state/music/track";
import { AssetType } from "~/components/marketplace/market_right";
import { ReactNode } from "react";

function CreatorTrack({
  item,
  assetItem,
  playable,
  buyModal,
  index,
}: {
  item: TrackItemType;
  assetItem?: AssetType;
  playable?: boolean;
  buyModal?: ReactNode;
  index: number;
}) {
  const trackUrlStore = usePlayerStore();

  function playSong() {
    if (playable) trackUrlStore.setNewTrack(item);
  }

  return (
    <div
      className="group cursor-pointer space-y-2 bg-slate-200 p-2 rounded-md"
      onClick={playable ? playSong : undefined}
    >
      <div className="relative aspect-square overflow-hidden rounded-md">
        <Image
          src={item.thumbnail}
          layout="fill"
          objectFit="cover"
          alt={`${item.code} cover`}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 transition-all duration-300 group-hover:bg-opacity-50">
          {playable ? (
            <PlayIcon className="h-12 w-12 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          ) : (
            <div className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {buyModal}
            </div>
          )}
        </div>
      </div>
      <div>
        <p className="text-base font-medium text-black line-clamp-1">{item.code}</p>
        <p className="text-sm text-gray-400 line-clamp-1">{item.artist}</p>
      </div>
    </div>
  );
}

export default CreatorTrack;

