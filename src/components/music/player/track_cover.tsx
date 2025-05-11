import { Song } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { SongItemType } from "../track/music_item";

export default function PlayerTrackCover({
  item,
}: {
  item: {
    thumbnail: string;
    code: string;
    artist: string;
    id?: string;
    name?: string;
  };
}) {
  return (
    <div className="flex flex-row items-center  py-2 ">
      {/* <img src="" alt="" /> */}
      <div className="bg-neutral-focus mr-4 h-20 w-20">
        <Image
          src={item.thumbnail}
          width={80}
          height={80}
          className="flex-shrink-0 overflow-clip"
          alt="music cover"
        />
      </div>
      <div className="w-40">
        <Link href={`/track/${item.id}`}>
          <p className="truncate text-base">{item.name}</p>
        </Link>
        <p className="truncate text-sm">{item.artist}</p>
      </div>
    </div>
  );
}
