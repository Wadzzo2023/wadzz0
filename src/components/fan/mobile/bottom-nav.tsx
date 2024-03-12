import { Home } from "lucide-react";
import React from "react";
import Link from "next/link";
import { Mode, useMode } from "~/lib/state/fan/left-side-mode";
import clsx from "clsx";
import { useRouter } from "next/router";

export default function BottomNav() {
  const { selectedMenu, toggleSelectedMenu } = useMode();
  const router = useRouter();

  return (
    <div className="btm-nav sm:hidden">
      {/* {Object.entries(getNavigation()).map(
        ([key, { path, icon: Icon, text }]) => (
          // <Link href={path} className="w-full">
          <Link
            href={path}
            key={key}
            className={clsx(
              "active",
              path == router.pathname && "text-primary",
            )}
          >
            <Icon />
            <span className="btm-nav-label">{text}</span>
          </Link>
          // </Link>
        ),
      )} */}
    </div>
  );
}
