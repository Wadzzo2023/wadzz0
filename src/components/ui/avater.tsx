import clsx from "clsx";
import Image from "next/image";
import React from "react";

export default function Avater(props: {
  className?: string;
  url?: string | null;
}) {
  return (
    <div className="avatar">
      <div className="mask mask-hexagon-2">
        {/* <div className=" rounded-full ring ring-primary ring-offset-2 ring-offset-base-100"> */}
        <div className={clsx("mask mask-hexagon-2", props.className)}>
          <Image
            className="aspect-square h-full w-full object-cover"
            src={props.url ?? "/images/icons/avatar-icon.png"}
            height={1000}
            width={1000}
            alt="User avatar"
          />
        </div>
      </div>
    </div>
  );
}
