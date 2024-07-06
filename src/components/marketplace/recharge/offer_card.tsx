import Image from "next/image";
import { Offer } from "./types";
import clsx from "clsx";
import { ReactNode } from "react";

interface IOfferCard extends Offer {
  selected: boolean;
  handleClick: () => void;
  extra?: ReactNode;
}

export default function OfferCard({
  num,
  price,
  handleClick,
  selected,
  extra,
}: IOfferCard) {
  return (
    <div
      onClick={handleClick}
      className={clsx(
        "card h-40 w-40 items-center justify-center bg-base-200 hover:bg-base-300",
        selected && "border-2 border-primary bg-base-300",
      )}
    >
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-1">
            <Image alt="Site logo" width={20} height={16} src="/favicon.ico" />
            <p className="text-lg">{num}</p>
          </div>
          {extra}
        </div>
      </div>
      <div className="mb-4 w-3/4 rounded-md bg-background">
        <p className="text-center text-2xl font-bold">${price}</p>
      </div>
    </div>
  );
}
