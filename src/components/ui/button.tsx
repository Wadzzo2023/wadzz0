import clsx from "clsx";
import { HomeIcon } from "lucide-react";
import { useRouter } from "next/router";
import React from "react";

export default function Button({
  icon: Icon,
  text,
  path,
}: {
  text: string;
  icon: React.ReactNode;
  path: string;
}) {
  const router = useRouter();

  return (
    <button
      className={clsx("btn  w-full", router.pathname == path && "btn-primary")}
    >
      {Icon}
      {text}
    </button>
  );
}
