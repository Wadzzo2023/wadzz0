import Image from "next/image";
import { PlayIcon } from "@heroicons/react/24/solid";
import { TrackItemType, usePlayerStore } from "~/lib/state/music/track";
import { ReactNode } from "react";
import { usePlayer } from "~/components/context/PlayerContext";
import { AssetType, SongItemType, useModal } from "~/lib/state/play/use-modal-store";
import { api } from "~/utils/api";
import { Button } from "~/components/shadcn/ui/button";

type AssetWithArtist = AssetType & {
  artist: string;
};


function CreatorTrack({
  item,
  assetItem,
  playable,
  buyModal,
  index,
}: {
  item: AssetWithArtist;
  assetItem?: AssetType;
  playable?: boolean;
  buyModal?: ReactNode;
  index: number;
}) {


  const song = api.music.song.getAsong.useQuery({ songId: item.id });
  const { onOpen } = useModal();
  const trackUrlStore = usePlayerStore();
  const { setCurrentTrack } = usePlayer();
  function playSong() {
    setCurrentTrack({
      id: item.id,
      artist: item.artist,
      assetId: item.id,
      price: 0,
      priceUSD: 0,
      albumId: 0,
      createdAt: new Date(),
      asset: item,
    });
  }
  console.log("item", item);
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
            <Button
              onClick={() => {
                onOpen("song buy modal", {
                  Song: song.data as SongItemType
                })
              }}
              className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Buy
            </Button>
          )}
        </div>
      </div>
      <div>
        <p className="text-base font-medium text-gray-800 truncate">{item.code}</p>
      </div>
    </div>
  );
}

export default CreatorTrack;
