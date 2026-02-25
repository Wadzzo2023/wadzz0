import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ComponentType, MouseEvent } from "react";
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
import fire from "./fire.png";
import like from "./like.png";
import start from "./start.png";
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
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [8, -8]), {
    stiffness: 140,
    damping: 22,
    mass: 0.6,
  });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 140,
    damping: 22,
    mass: 0.6,
  });
  const fireOffsetX = useSpring(useTransform(pointerX, [-0.5, 0.5], [-14, 14]), {
    stiffness: 120,
    damping: 24,
  });
  const fireOffsetY = useSpring(useTransform(pointerY, [-0.5, 0.5], [-10, 10]), {
    stiffness: 120,
    damping: 24,
  });
  const likeOffsetX = useSpring(useTransform(pointerX, [-0.5, 0.5], [12, -12]), {
    stiffness: 120,
    damping: 24,
  });
  const likeOffsetY = useSpring(useTransform(pointerY, [-0.5, 0.5], [8, -8]), {
    stiffness: 120,
    damping: 24,
  });

  const handleParallaxMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    pointerX.set(x);
    pointerY.set(y);
  };

  const handleParallaxLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

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
          className="pointer-events-none absolute inset-0 z-10 mx-auto flex h-full w-full max-w-4xl items-center justify-center px-4 pb-36 md:pb-20"
        >
          <div
            className="relative pointer-events-auto"
            onMouseMove={handleParallaxMove}
            onMouseLeave={handleParallaxLeave}
          >
            <motion.article
              initial={{ opacity: 1, y: 26, scale: 0, rotate: 0 }}
              animate={{
                y: 0,
                scale: [0, 1.03, 1],
                rotate: [0, 0, -1.2],
              }}
              transition={{
                delay: 0.4,
                duration: 1.1,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.74, 1],
              }}
              style={{ rotateX, rotateY, transformPerspective: 1200 }}
              className="w-[min(92vw,740px)] rounded-[2rem] border border-white/30 bg-white/80 px-5 py-6 text-black/90 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl md:px-7 md:py-8"
            >
              <motion.h1
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.56, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="text-center text-2xl font-semibold tracking-tight md:text-4xl"
              >
                Rewards Are Waiting Around You
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.64, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="mt-2 text-center text-sm text-black/65 md:text-lg"
              >
                Collect digital souvenirs. Unlock local perks. Explore your city.
              </motion.p>

              <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:mt-8">
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.72, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center"
                >
                  <div className="mx-auto mb-2 size-16 rounded-full bg-gradient-to-b from-emerald-300 to-lime-500 md:size-20" />
                  <p className="text-sm text-black/55 md:text-base">You</p>
                  <p className="text-xl font-semibold md:text-3xl">48 Spots</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.78, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="grid place-items-center"
                >
                  <div className="size-px h-20 w-px bg-black/15 md:h-24" />
                  <div className="-mt-12 rounded-full bg-black/10 px-3 py-1 text-sm font-semibold text-black/70 md:-mt-14">
                    VS
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.84, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center"
                >
                  <div className="mx-auto mb-2 size-16 rounded-full bg-gradient-to-b from-sky-300 to-indigo-500 md:size-20" />
                  <p className="text-sm text-black/55 md:text-base">City Avg</p>
                  <p className="text-xl font-semibold md:text-3xl">62 Spots</p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.92, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6 flex justify-center md:mt-8"
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-[#dce4ff] px-6 py-3 text-lg font-semibold text-blue-700 md:text-2xl"
                >
                  <Image src={start} alt="" className="size-6 md:size-8" />
                  Start Nearby Hunt
                </button>
              </motion.div>
            </motion.article>

            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.8, rotate: -8 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              transition={{ delay: 1.02, duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -right-8 -top-10 md:-right-12 md:-top-16"
            >
              <motion.div style={{ x: fireOffsetX, y: fireOffsetY }}>
                <Image src={fire} alt="" className="w-20 md:w-32" />
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.8, rotate: -26 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: -18 }}
              transition={{ delay: 1.08, duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-8 -left-6 md:-bottom-12 md:-left-12"
            >
              <motion.div style={{ x: likeOffsetX, y: likeOffsetY }}>
                <Image src={like} alt="" className="w-16 md:w-24" />
              </motion.div>
            </motion.div>
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
