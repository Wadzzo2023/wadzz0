import clsx from "clsx";
import { HomeIcon } from "lucide-react";
import { useRouter } from "next/router";
import React from "react";

export default function Button({
  icon: Icon,
  text,
  path,
  className,
}: {
  text: string;
  icon?: React.ReactNode;
  path: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <button
      className={clsx(
        "btn  w-full",
        router.pathname == path && "bg-[#39BD2B] text-white",
        className,
      )}
    >
      {/* {Icon} */}
      <p className="">{text}</p>
    </button>
  );
}
