import { Song } from "@prisma/client";
import { api } from "~/utils/api";
import { MusicItem } from ".";

type TrackSectionProp = {
  header: string;
};

export default function TrackSection({ header }: TrackSectionProp) {
  const songs = api.music.song.getUserBuyedSongs.useQuery();

  if (songs.isLoading) return <span className="loading loading-spinner" />;

  if (songs.data)
    return (
      <div>
        <h3 className="py-2 text-2xl font-bold">{header}</h3>
        {songs.data.map((song) => (
          <p key={song.id}>1</p>
          // <MusicItem key={song.id} item={song} />
        ))}

        <div className="flex flex-col gap-2"></div>
      </div>
    );
}
