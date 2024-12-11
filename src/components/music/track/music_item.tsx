import { Song } from "@prisma/client";
import clsx from "clsx";
import Image from "next/image";
import { usePlayerStore } from "~/lib/state/music/track";
import { PlayOrBuy } from "../album/table";
import { AssetBadge } from "./asset_badge";
import { Pause, PlayIcon } from "lucide-react";
import { usePlayer } from "~/components/context/PlayerContext";
import { SongItemType } from "~/lib/state/play/use-modal-store";


export default function MusicItem({
  item,
  playable,
  index,
  className,
}: {
  item: SongItemType;
  playable?: boolean;
  index: number;
  className?: string;
}) {
  const trackUrlStore = usePlayerStore();
  const { setCurrentTrack, currentTrack, isPlaying } = usePlayer()

  function playSong() {
    if (item && item.asset) {
      setCurrentTrack(item);

      if (playable) {
        trackUrlStore.setNewTrack({
          artist: item.artist,
          code: item.asset.code,
          thumbnail: item.asset.thumbnail,
          mediaUrl: item.asset.mediaUrl,
          name: item.asset.name,
        });
      }
    }
  }


  return (
    <div
      className="group cursor-pointer space-y-2"
      onClick={playSong}
    >
      <div className={clsx("relative aspect-square overflow-hidden rounded-md shadow-md", {
        className
      })}>
        <Image
          src={item.asset.thumbnail}
          layout="fill"
          objectFit="cover"
          alt={`${item.asset.code} cover`}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-0 transition-all duration-300 group-hover:bg-opacity-50">
          {
            currentTrack && currentTrack.id === item.id && isPlaying ? (
              <Pause className="h-10 w-10" />) : <PlayIcon className="h-10 w-10" />

          }
        </div>
      </div>
      <div>
        <p className="text-base font-medium text-gray-800 line-clamp-1">{item.asset.code}</p>
        <p className="text-sm text-gray-600 line-clamp-1">{item.artist}</p>
      </div>
    </div>
  );
}
