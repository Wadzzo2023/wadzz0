import clsx from "clsx";
import React from "react";

export default function Avater(props: {
  className?: string;
  url?: string | null;
}) {
  return (
    <div className="avatar">
      <div className="mask mask-hexagon ">
        {/* <div className=" rounded-full ring ring-primary ring-offset-2 ring-offset-base-100"> */}
        <div className={clsx("mask mask-hexagon", props.className)}>
          <img src={props.url ?? "/images/icons/avatar-icon.png"} />
        </div>
      </div>
    </div>
  );
}
