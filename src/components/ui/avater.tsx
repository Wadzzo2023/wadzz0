import clsx from "clsx";
import React from "react";

export default function Avater(props: {
  className?: string;
  url?: string | null;
}) {
  return (
    <div className="avatar">
      <div className={clsx("w-10 rounded-full", props.className)}>
        <img
          src={
            props.url ??
            "https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg"
          }
        />
      </div>
    </div>
  );
}
