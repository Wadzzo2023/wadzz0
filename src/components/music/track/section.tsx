
import MusicItem, { SongItemType } from "./music_item";

type TrackSectionProp = {
  header: string;
  songs: SongItemType[];
  playable?: boolean;
};

export default function TrackSection({ header, playable, songs }: TrackSectionProp) {
  if (songs && songs.length > 0)
    return (
      <div className="w-full">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">{header}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {songs.map((song, index: number) => (
            <MusicItem key={song.id} item={song} playable={playable} index={index + 1} />
          ))}
        </div>
      </div>
    );
}

export function TrackSectionSkeleton({ header, count = 10 }: { header: string; count?: number }) {
  return (
    <div className="w-full">
      <h2 className="mb-4 text-2xl font-bold text-gray-800">{header}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: count }, (_, i: number) => (
          <div key={i} className="aspect-square animate-pulse rounded-md bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
