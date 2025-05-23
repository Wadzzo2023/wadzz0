import Image from "next/image";
import clsx from "clsx";
import { ReactNode } from "react";

interface ICovnertCard {
  selected: boolean;
  handleClick: () => void;
  extra?: ReactNode;
}
export default function ConvertCard({
  handleClick,
  selected,
  extra,
}: ICovnertCard) {
  return (
    <div
      onClick={handleClick}
      className={clsx(
        "card  h-40 w-40 items-center justify-center bg-base-200 hover:bg-base-300",
        selected && "border-2 border-primary bg-base-300",
      )}
    >
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <div className="justify-center-center flex items-center gap-1">
            <Image alt="site logo" width={20} height={16} src="/favicon.ico" />
            <p className=" text-lg">{100}</p>
          </div>
          {extra}
        </div>
      </div>
      <div className="bg-background mb-4 w-3/4 rounded-md">
        <p className="text-center text-2xl font-bold">${100}</p>
      </div>
    </div>
  );
}
