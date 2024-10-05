import clsx from "clsx";
import { Trophy } from "lucide-react";
import Image from "next/image";
import React from "react";

export default function Avater(props: {
  className?: string;
  url?: string | null;
  winnerCount?: number;
}) {
  return (
    <div className="avatar relative">
      <div className="mask mask-hexagon-2">
        {/* <div className=" rounded-full ring ring-primary ring-offset-2 ring-offset-base-100"> */}
        <div className={clsx("mask mask-hexagon-2 ", props.className)}>
          <div className="">
            <Image
              className="aspect-square h-full w-full object-cover "
              src={props.url ?? "/images/icons/avatar-icon.png"}
              height={1000}
              width={1000}
              alt="User avatar"
            />
          </div>
        </div>
      </div>
      {props.winnerCount && props.winnerCount > 0 ? (
        <span className="absolute -left-3   bottom-0 h-7 w-7 rounded-full bg-[#DBDC2C]">
          <span className="absolute bottom-[.4rem]    right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full ">
            <Trophy size={14} />
          </span>
          <span className="absolute bottom-[.4rem]   right-[.1rem] text-xs font-bold">
            {props.winnerCount}
          </span>
        </span>
      ) : (
        <></>
      )}
    </div>
  );
}
