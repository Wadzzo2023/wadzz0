import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ComponentType } from "react";
import type { IconWeight } from "@phosphor-icons/react";
import {
  BookmarkSimpleIcon,
  GearSixIcon,
  GiftIcon,
  HouseLineIcon,
  PlusIcon,
  StorefrontIcon,
  TrashIcon,
  UserCircleIcon,
  UserIcon,
} from "@phosphor-icons/react/dist/ssr";

import bg from "./bg.png";
import { cn } from "~/lib/utils";

type NavItem = {
  key: string;
  path: string;
  text: string;
  icon: ComponentType<{ className?: string; weight?: IconWeight }>;
  isButton?: boolean;
  dashed?: boolean;
};

const leftSection: NavItem[] = [
  { key: "Home", path: "/", text: "Homepage", icon: HouseLineIcon },
  {
    key: "Collection",
    path: "/assets",
    text: "Collection",
    icon: BookmarkSimpleIcon,
  },
  { key: "Bounty", path: "/bounty", text: "Bounty", icon: GiftIcon },
  {
    key: "Marketplace",
    path: "/marketplace",
    text: "Marketplace",
    icon: StorefrontIcon,
  },
  { key: "Artist", path: "/fans/home", text: "Creators", icon: UserCircleIcon },
];

const profileSection: NavItem[] = [
  { key: "Profile", path: "/profile/reza", text: "Reza Morsd", icon: UserIcon },
  {
    key: "AddProfile",
    path: "",
    text: "Add Profile",
    icon: PlusIcon,
    isButton: true,
    dashed: true,
  },
];

const rightSection: NavItem[] = [
  { key: "Settings", path: "/settings", text: "Settings", icon: GearSixIcon },
  { key: "Delete", path: "/new-nav", text: "Delete", icon: TrashIcon },
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
  const canExpand = isExpanded && !item.isButton;
  const itemBody = (
    <motion.div
      layout
      className={cn(
        "flex h-12 items-center rounded-xl px-3 transition-colors",
        canExpand ? "gap-2" : "gap-0",
        "border border-white/10 bg-white/20 text-white backdrop-blur-xl",
        isActive &&
          !item.isButton &&
          "bg-[#18871c] text-white hover:bg-[#18871c]",
        item.dashed ? "border border-dashed border-white/50" : "border-solid",
      )}
      transition={{ type: "spring", damping: 28, stiffness: 220 }}
    >
      <div className="grid size-6 place-items-center">
        <Icon className="size-6" />
      </div>

      <motion.div
        className="overflow-hidden"
        initial={false}
        animate={{
          maxWidth: canExpand ? 160 : 0,
        }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.span
          initial={false}
          animate={{
            opacity: canExpand ? 1 : 0,
            x: canExpand ? 0 : -6,
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="whitespace-nowrap pr-1 font-medium capitalize"
        >
          {item.text}
        </motion.span>
      </motion.div>
    </motion.div>
  );

  return (
    <motion.div layout>
      {item.isButton ? (
        <button type="button" className="block">
          {itemBody}
        </button>
      ) : (
        <Link
          href={{ pathname: "/new-nav", query: { active: item.key } }}
          aria-current={isActive ? "page" : undefined}
          className="block"
        >
          {itemBody}
        </Link>
      )}
    </motion.div>
  );
}

export default function NewNav() {
  const router = useRouter();

  const activeParam = router.query.active;
  const activeKey = typeof activeParam === "string" ? activeParam : "";

  return (
    <main className="relative size-full overflow-hidden">
      <motion.div
        aria-hidden
        drag
        dragConstraints={{ left: -40, right: 40, top: -28, bottom: 28 }}
        dragElastic={0.08}
        whileDrag={{ scale: 1.16 }}
        className="absolute inset-[-7%] cursor-grab active:cursor-grabbing"
        initial={{ scale: 1.02, x: 0, y: 0 }}
        animate={{ scale: 1.12, x: 0, y: 0 }}
        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: `url(${bg.src}) no-repeat center / cover`,
        }}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0, scale: 1.06, backgroundPosition: "50% 58%" }}
        animate={{ opacity: 1, scale: 1, backgroundPosition: "50% 50%" }}
        transition={{ delay: 0.2, duration: 1.9, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background:
            "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(0, 0, 0, 0.21) 70.67%, rgba(0, 0, 0, 0.7) 100%)",
          backgroundSize: "100% 120%",
        }}
      />

      <style global>{`
        body {
          background: #fff !important;
          background-image: none !important;
        }

        #__next,
        html,
        body {
          height: 100%;
          overflow-x: hidden;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-40% via-black/40 to-transparent ">
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute inset-0 z-10 mx-auto flex h-full w-full max-w-3xl items-center justify-center px-4 pb-32 text-center text-white md:pb-12"
        >
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Rewards Are Waiting Around You.
            </h1>
            <p className="mt-3 text-lg text-white/85 md:text-2xl">
              Collect digital souvenirs. Unlock local perks. Explore your city.
            </p>
          </div>
        </motion.header>
      </div>

      <div className="pointer-events-none fixed inset-0 flex items-end justify-center px-2 pb-6 md:px-4">
        <motion.div
          layout
          initial={{ y: 42, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 22, stiffness: 280 }}
          className="pointer-events-auto z-20 w-fit max-w-[calc(100vw-1rem)] rounded-2xl border border-lime-500/30 bg-lime-700/15 p-2 saturate-150 backdrop-blur-xl md:max-w-[calc(100vw-2rem)]"
        >
          <motion.nav
            layout
            className="flex items-center gap-2 overflow-x-hidden"
          >
            {leftSection.map((item) => {
              const isActive = activeKey === item.key;
              const isExpanded = isActive;

              return (
                <FloatingNavItem
                  key={item.key}
                  item={item}
                  isActive={isActive}
                  isExpanded={isExpanded}
                />
              );
            })}

            <div className="mx-1 h-8 w-px bg-white/20" />

            {profileSection.map((item) => {
              const isActive = activeKey === item.key;
              const isExpanded = isActive;

              return (
                <FloatingNavItem
                  key={item.key}
                  item={item}
                  isActive={isActive}
                  isExpanded={isExpanded}
                />
              );
            })}

            <div className="mx-1 h-8 w-px bg-white/20" />

            {rightSection.map((item) => {
              const isActive = activeKey === item.key;
              const isExpanded = isActive;

              return (
                <FloatingNavItem
                  key={item.key}
                  item={item}
                  isActive={isActive}
                  isExpanded={isExpanded}
                />
              );
            })}
          </motion.nav>
        </motion.div>
      </div>
    </main>
  );
}
