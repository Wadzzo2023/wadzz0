"use client";

import { motion } from "framer-motion";
import type { ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ExternalLink,
  Headphones,
  Home,
  Library,
  MapPinned,
  Music,
  Music2,
  Newspaper,
  Sparkles,
  Store,
  UserRound,
} from "lucide-react";

import { LeftNavigation } from "~/components/left-sidebar";
import { cn } from "~/utils/utils";

type NavItem = {
  key: string;
  path: string;
  text: string;
  icon: ComponentType<{ className?: string }>;
  external?: boolean;
  dashed?: boolean;
};

const sidebarIconMap = {
  dashboard: Home,
  marketplace: Store,
  collection: Library,
  music: Music2,
  store: Store,
  bounty: Sparkles,
  creator: UserRound,
  feed: Newspaper,
  spotify: Headphones,
  link: ExternalLink,
  fan: Newspaper,
} as const;

const baseItems: NavItem[] = Object.entries(LeftNavigation).map(([key, item]) => {
  const fallbackIcon = item.icon;
  const normalizedKey = key.toLowerCase();
  const mappedFromKey = sidebarIconMap[normalizedKey as keyof typeof sidebarIconMap];
  const isCollectionRoute = item.path === "/assets" || item.text.toLowerCase().includes("collection");
  const mappedIcon = item.path.includes("/music")
    ? Music
    : item.path === "/feed"
      ? Newspaper
    : isCollectionRoute
      ? Library
    : mappedFromKey ?? fallbackIcon;

  return {
    key,
    path: item.path,
    text: item.text,
    icon: mappedIcon,
    external: item.path.startsWith("http"),
    dashed: item.path.startsWith("http"),
  };
}).filter((item) => item.path !== "/settings");

const navItems: NavItem[] = [
  ...baseItems,
  {
    key: "Claim",
    path: "/maps/pins/my",
    text: "CLAIM",
    icon: MapPinned,
  },
];

function FloatingNavItem({
  item,
  isActive,
  isExpanded,
}: {
  item: NavItem;
  isActive: boolean;
  isExpanded: boolean;
}) {
  const Icon = item.icon;
  const canExpand = isExpanded;

  const itemBody = (
    <motion.div
        className={cn(
          "relative flex h-10 items-center overflow-hidden rounded-xl px-2.5 transition-colors md:h-12 md:px-3",
        canExpand ? "gap-0 md:gap-2" : "gap-0",
        "border border-black/20 text-black/85",
        isActive && "text-black",
        item.dashed ? "border-dashed border-black/35" : "border-solid",
        isActive && "shadow-[0_0_0_1px_rgba(22,163,74,0.5),0_0_18px_rgba(22,163,74,0.4)]",
      )}
      transition={{ type: "spring", stiffness: 180, damping: 24, mass: 0.9 }}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0 rounded-xl backdrop-blur-[2px]",
          isActive ? "bg-green-500/55" : "bg-white/75",
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0 rounded-xl shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.8),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.5)]",
          isActive &&
            "shadow-[inset_1px_1px_1px_0_rgba(220,252,231,0.98),_inset_-1px_-1px_1px_1px_rgba(187,247,208,0.8),0_0_16px_rgba(22,163,74,0.42)]",
        )}
      />

      <div className="relative z-30 grid size-5 place-items-center md:size-6">
        <Icon className="size-5 md:size-6" />
      </div>

      <motion.div
        className="relative z-30 hidden overflow-hidden md:block"
        initial={false}
        animate={{ maxWidth: canExpand ? 160 : 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.span
          initial={false}
          animate={{ opacity: canExpand ? 1 : 0, x: canExpand ? 0 : -6 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 hidden whitespace-nowrap pr-1 text-sm font-medium uppercase md:inline"
        >
          {item.text}
        </motion.span>
      </motion.div>
    </motion.div>
  );

  if (item.external) {
    return (
      <a
        href={item.path}
        aria-current={isActive ? "page" : undefined}
        className="block"
        target="_blank"
        rel="noreferrer"
      >
        {itemBody}
      </a>
    );
  }

  return (
    <Link href={item.path} aria-current={isActive ? "page" : undefined} className="block">
      {itemBody}
    </Link>
  );
}

export default function GlobalFloatingNav() {
  const router = useRouter();

  const activeKey =
    navItems.find((item) =>
      item.path === "/" ? router.pathname === "/" : router.pathname?.startsWith(item.path),
    )?.key ?? "";

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-end justify-center px-2 pb-4 md:px-4 md:pb-6">
      <motion.div
        layout="position"
        initial={{ y: 42, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 145, damping: 24, mass: 0.95 }}
        className="pointer-events-auto relative z-20 w-fit max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-black/20 p-1.5 md:max-w-[calc(100vw-2rem)] md:p-2"
      >
        <div className="pointer-events-none absolute inset-0 z-0 rounded-2xl bg-[#f3f1ea]/60 backdrop-blur-[8px]" />
        <div className="pointer-events-none absolute inset-0 z-0 rounded-2xl bg-[radial-gradient(circle_at_20%_20%,rgba(255,251,242,0.24),rgba(248,243,232,0.08)_55%,rgba(245,240,230,0.03)_100%)]" />
        <div className="pointer-events-none absolute inset-0 z-0 rounded-2xl shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.85),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.5)]" />

        <motion.nav className="relative z-10 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:gap-2 md:overflow-x-hidden">
          {navItems.map((item) => (
            <FloatingNavItem
              key={item.key}
              item={item}
              isActive={activeKey === item.key}
              isExpanded={activeKey === item.key}
            />
          ))}
        </motion.nav>
      </motion.div>
    </div>
  );
}
