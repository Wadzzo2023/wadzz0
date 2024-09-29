import Image from "next/image";
import PlayerTrackCover from "./track_cover";
import { SongItemType } from "../track/music_item";

export function PlayerSongCover({
  song,
  small = false,
}: {
  song?: { thumbnail: string; artist: string; name: string; code: string };
  small?: boolean;
}) {
  if (song) {
    if (small) {
      return (
        <div className="mr-10 flex h-10 flex-row gap-2 ">
          <Image
            src={song.thumbnail}
            width={40}
            height={40}
            className=" overflow-clip"
            alt="music cover"
          />

          <div className="w-20">
            <p className="truncate text-base">{song.name}</p>
            <p className="truncate text-sm">{song.artist}</p>
          </div>
        </div>
      );
    } else
      return (
        <PlayerTrackCover
          item={{
            artist: song.artist,
            code: song.code,
            thumbnail: song.thumbnail,
            name: song.name,
          }}
        />
      );
  } else
    return (
      <div className="flex flex-1 items-center justify-center">
        <p>No selected song</p>
      </div>
    );
}
