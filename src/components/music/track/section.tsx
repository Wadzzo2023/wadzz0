import { api } from "~/utils/api";
import { MusicItem } from ".";
import { SongItemType } from "./music_item";

type TrackSectionProp = {
  header: string;
  songs: SongItemType[];
};

export default function TrackSection({ header }: TrackSectionProp) {
  const songs = api.music.song.getUserBuyedSongs.useQuery();

  if (songs.isLoading) return <span className="loading loading-spinner" />;

  if (songs.data)
    return (
      <div>
        <h3 className="py-2 text-2xl font-bold">{header}</h3>
        {songs.data.map((song) => (
          <MusicItem key={song.id} item={song} />
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
      <h3 className="py-2 text-2xl font-bold">Playable songs</h3>
      <div className="skeleton my-2 h-10 w-full" />
      <div className="skeleton h-10 w-full" />
    </div>
  );
}
