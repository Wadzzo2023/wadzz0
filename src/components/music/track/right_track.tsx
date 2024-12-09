import { api } from "~/utils/api";
import { MusicItem } from ".";
import { SongItemType } from "./music_item";
import { usePlayer } from "~/components/context/PlayerContext";

type TrackSectionProp = {
  songs: SongItemType[];
  playable?: boolean;
};

export default function RightTrackSection({

  playable,
  songs,
}: TrackSectionProp) {
  // const { setPlaylist } = usePlayer()

  if (songs)
    // setPlaylist(songs)
    return (
      <div>
        {songs.map((song, index) => (
          <MusicItem key={song.id} item={song} playable={playable} index={index + 1}
            className="h-12 w-12"
          />
        ))}

        <div className="flex flex-col gap-2"></div>
      </div>
    );
}

export function TrackSectionSkeleton({
  header,
  count = 2,
}: {
  header: string;
  count?: number;
}) {
  return (
    <div>
      <h3 className="py-2 text-2xl font-bold">{header}</h3>
      <div className="skeleton my-2 h-10 w-full" />
      <div className="skeleton h-10 w-full" />
    </div>
  );
}
