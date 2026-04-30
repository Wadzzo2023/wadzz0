"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ExternalLink,
  Headphones,
  Home,
  Library,
  MapPinned,
  Menu,
  Music,
  Music2,
  Newspaper,
  Sparkles,
  Store,
  UserRound,
} from "lucide-react";
import { useState, useEffect } from "react";

import { LeftNavigation } from "~/components/left-sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
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

const baseItems: NavItem[] = Object.entries(LeftNavigation)
  .map(([key, item]) => {
    const fallbackIcon = item.icon;
    const normalizedKey = key.toLowerCase();
    const mappedFromKey =
      sidebarIconMap[normalizedKey as keyof typeof sidebarIconMap];
    const isCollectionRoute =
      item.path === "/assets" || item.text.toLowerCase().includes("collection");
    const mappedIcon = item.path.includes("/music")
      ? Music
      : item.path === "/feed" || item.path === "/fans/home"
        ? Newspaper
        : isCollectionRoute
          ? Library
          : (mappedFromKey ?? fallbackIcon);

    return {
      key,
      path: item.path,
      text: item.text,
      icon: mappedIcon,
      external: item.path.startsWith("http"),
      dashed: item.path.startsWith("http"),
    };
  })
  .filter((item) => item.path !== "/settings" && !item.path.startsWith("/music"));

const navItems: NavItem[] = [
  ...baseItems,
  {
    key: "Claim",
    path: "/maps/pins/my",
    text: "CLAIM",
    icon: MapPinned,
  },
  {
    key: "brand",
    path: "https://brand.wadzzo.com/",
    text: "BRAND",
    icon: ExternalLink,
    external: true,
    dashed: true,
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
        "relative flex h-14 md:h-16 items-center overflow-hidden rounded-xl px-2.5 transition-colors md:px-3 border border-transparent",
        canExpand ? "gap-0 md:gap-2" : "gap-0",
        isActive && "text-black",
        item.dashed ? "border-dashed border-black/35" : "border-solid",
      )}
      transition={{ type: "spring", stiffness: 180, damping: 24, mass: 0.9 }}
    >
      <div className={cn("relative z-30 grid place-items-center w-auto h-full py-2", isActive && 'text-green-700')}>
        <Icon className="size-5 md:size-6 min-w-6" />
        <span className="text-sm font-medium mt-1">{item.text}</span>
      </div>
    </motion.div>
  );

  const linkContent = (
    <motion.div>
      {item.external ? (
        <a
          href={item.path}
          aria-current={isActive ? "page" : undefined}
          className="block"
          target="_blank"
          rel="noreferrer"
        >
          {itemBody}
        </a>
      ) : (
        <Link
          href={item.path}
          aria-current={isActive ? "page" : undefined}
          className="block"
        >
          {itemBody}
        </Link>
      )}
    </motion.div>
  );

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
      <TooltipContent side="top" className="capitalize">
        {item.text}
      </TooltipContent>
    </Tooltip>
  );
}

function MobileNavItem({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  const Icon = item.icon;

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl px-4 py-3 transition-colors",
      isActive && "bg-black/5 text-green-700"
    )}>
      {item.external ? (
        <a
          href={item.path}
          className="flex items-center gap-3 w-full"
          target="_blank"
          rel="noreferrer"
        >
          <Icon className="size-5 min-w-5" />
          <span className="font-medium text-base">{item.text}</span>
        </a>
      ) : (
        <Link
          href={item.path}
          className="flex items-center gap-3 w-full"
        >
          <Icon className="size-5 min-w-5" />
          <span className="font-medium text-base">{item.text}</span>
        </Link>
      )}
    </div>
  );
}

export default function GlobalFloatingNav() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeKey =
    navItems.find((item) =>
      item.path === "/"
        ? router.pathname === "/"
        : router.pathname?.startsWith(item.path),
    )?.key ?? "";

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const desktopNav = (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-end justify-center px-2 pb-4 md:px-4 md:pb-6">
      <motion.div
        layout="position"
        initial={{ y: 42, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 145, damping: 24, mass: 0.95 }}
        className="pointer-events-auto relative z-20 w-fit max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-black/15 p-1.5 md:max-w-[calc(100vw-2rem)] md:p-2"
      >
        <div className="pointer-events-none absolute inset-0 z-0 rounded-2xl bg-[#f3f1ea]/90 backdrop-blur-[8px]" />
        <div className="pointer-events-none absolute inset-0 z-0 rounded-2xl bg-[radial-gradient(circle_at_20%_20%,rgba(255,251,242,0.24),rgba(248,243,232,0.08)_55%,rgba(245,240,230,0.03)_100%)]" />
        <div className="pointer-events-none absolute inset-0 z-0 rounded-2xl shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.85),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.5)]" />

        <TooltipProvider delayDuration={300}>
          <motion.nav className="relative z-10 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] md:gap-2 md:overflow-x-hidden [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => (
              <FloatingNavItem
                key={item.key}
                item={item}
                isActive={activeKey === item.key}
                isExpanded={activeKey === item.key}
              />
            ))}
          </motion.nav>
        </TooltipProvider>
      </motion.div>
    </div>
  );

  const mobileNav = (
    <>
      {/* <button
        onClick={() => setSheetOpen(true)}
        className="pointer-events-auto fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 flex h-14 w-14 items-center justify-center rounded-full border border-black/15 bg-[#f3f1ea]/90 backdrop-blur-[8px] shadow-lg"
      >
        <Menu className="size-6" />
      </button> */}

      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
              className="fixed inset-0 z-[61] bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
              className="fixed inset-x-0 bottom-0 z-[62] rounded-t-2xl border-t border-black/15 bg-[#f3f1ea]/95 backdrop-blur-[8px] px-4 pb-8 pt-6"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-black/20" />
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <div key={item.key} onClick={() => setSheetOpen(false)}>
                    <MobileNavItem
                      item={item}
                      isActive={activeKey === item.key}
                    />
                  </div>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );

  return isMobile ? mobileNav : desktopNav;
}
