import Image from "next/image";
import Link from "next/link";
import { Song } from "~/lib/types/dbTypes";
import { AssetBadge } from "./asset_badge";
import { PlayCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "~/lib/states/track";
import clsx from "clsx";

export default function MusicItem({
  item,
  albumId,
  playable,
}: {
  item: Song;
  albumId: string;
  playable?: boolean;
}) {
  const [hovered, setHoved] = useState(false);
  const { song: playedSong, setNewTrack } = usePlayerStore();
  const [divWidth, setDivWidth] = useState<number>();
  const [divWidth2, setDivWidth2] = useState<number>();

  const divRef = useRef<HTMLDivElement>(null);
  const divRef2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (divRef.current) {
      const divW = divRef.current.offsetWidth;
      setDivWidth(divW);
      // toast(`div1 ${divW}`);
    }
    if (divRef2.current) {
      const divW = divRef2.current.offsetWidth;
      setDivWidth2(divW);
      // toast(`div2 ${divW}`);
    }
  }, []);

  if (!playable) {
    return (
      <div className="flex flex-row items-center justify-between   p-2">
        <div className="flex">
          <div className="mr-4 h-10 w-10 flex-shrink-0 bg-neutral-focus">
            <Image
              src={item.coverImgUrl}
              width={40}
              height={40}
              alt="music cover"
            />
          </div>
          <div ref={divRef2} className="" style={{ width: divWidth2 }}>
            <Link href={`/track/${item.id}`}>
              <p
                className={clsx(
                  " text-base font-bold",
                  divWidth2 && "truncate",
                )}
              >
                {item.name}
              </p>
            </Link>
            <p className={clsx("text-sm", divWidth2 && "truncate")}>
              {item.artist}
            </p>
          </div>
        </div>
        <div>
          <AssetBadge asset={item.songAsset} />
        </div>
      </div>
    );
  } else {
    return (
      <div
        className={clsx(
          "flex flex-row items-center justify-between p-2",
          playedSong?.id === item.id && "bg-base-300",
        )}
        onClick={() => setNewTrack(item)}
        onMouseOver={() => setHoved(true)}
        onMouseOut={() => setHoved(false)}
      >
        <div className="flex ">
          <div className="mr-4 h-10 w-10 bg-neutral-focus">
            <Image
              src={item.coverImgUrl}
              width={40}
              height={40}
              alt="music cover"
            />
          </div>
          <div ref={divRef} style={{ width: divWidth }}>
            <p className={clsx(" text-base font-bold", divWidth && "truncate")}>
              {item.name}
            </p>
            <p className={clsx("text-sm", divWidth && "truncate")}>
              {item.artist}
            </p>
          </div>
        </div>
        {hovered || playedSong?.id === item.id ? (
          <PlayCircle
            color={playedSong?.id === item.id ? "#d8dc29" : undefined}
          />
        ) : null}
      </div>
    );
  }
}
