import Image from "next/image";
import clsx from "clsx";
import { AssetBadge } from "../track/asset_badge";

function CreatorTrack({
  artist,
  code,
  thumbnail,
}: {
  thumbnail: string;
  code: string;
  artist: string;
}) {
  return (
    <div
      className="flex max-w-md flex-row items-center   justify-between p-2 hover:bg-base-100"
      //   onClick={}
    >
      <div className="flex">
        <div className="bg-neutral-focus mr-4 h-10 w-10 flex-shrink-0">
          <Image src={thumbnail} width={40} height={40} alt="music cover" />
        </div>
        <div className="">
          <p className={clsx(" text-base font-bold")}>{code}</p>
          <p className={clsx("text-sm")}>{artist}</p>
        </div>
      </div>
      <div>
        <AssetBadge asset={{ code: "vong", issuer: "cong" }} />
      </div>
    </div>
  );
}

export default CreatorTrack;
