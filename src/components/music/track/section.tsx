import { Song } from "@prisma/client";

type TrackSectionProp = {
  songs: Song[];
  header: string;
  playable?: boolean;
  itemsPerPage?: number;
};

export default function TrackSection({
  songs,
  header,
  playable,
  itemsPerPage,
}: TrackSectionProp) {
  return (
    <div>
      <h3 className="py-2 text-2xl font-bold">{header}</h3>
      {songs.length > 0 ? (
        // <SongPaginationList
        //   itemsPerPage={itemsPerPage}
        //   playable={playable}
        //   items={songs}
        // />
        <p>Song Paginat elist</p>
      ) : (
        <p>No song</p>
      )}
      <div className="flex flex-col gap-2"></div>
    </div>
  );
}
