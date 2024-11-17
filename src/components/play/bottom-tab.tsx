"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Book, Pen, Trophy } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const iconsOne = [
  { id: 1, Icon: Home, href: "/play/map", label: "Maps" },

  { id: 2, Icon: Book, href: "/play/collection", label: "Collection" },
];
const iconsTwo = [
  { id: 4, Icon: Trophy, href: "/play/bounty", label: "Bounty" },

  { id: 5, Icon: Pen, href: "/play/profile", label: "Profile" },
];

export const BottomTab = () => {
  const path = usePathname();
  const dockRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <header className=" absolute -bottom-6 z-50  w-full  py-6">
      <div className="container">
        <div className="flex  items-center justify-between rounded-t-xl bg-[#38C02B] p-2  md:border ">
          <div className="w-full">
            <nav
              className="flex justify-center gap-8 rounded-t-xl bg-[#38C02B] p-2 text-sm md:rounded-none md:p-0 "
              ref={dockRef}
            >
              {iconsOne.map(({ Icon, href, label, id }) => (
                <motion.div
                  key={id}
                  className="group relative "
                  onMouseEnter={() => setHoveredIndex(id)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  animate={{
                    scale: hoveredIndex === id ? 1.5 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Link
                    href={href}
                    aria-label={label}
                    className="block rounded-full bg-[#38C02B] p-2  transition-colors"
                  >
                    <Icon className="h-6 w-6" />
                  </Link>
                  <AnimatePresence>
                    {hoveredIndex === id && (
                      <motion.span
                        className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {path === href && (
                    <motion.div
                      className="absolute -bottom-2 left-1/2 h-1 w-1 rounded-full bg-white"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      layoutId="activeIndicator"
                    />
                  )}
                </motion.div>
              ))}

              <motion.div
                className="group relative "
                onMouseEnter={() => setHoveredIndex(3)}
                onMouseLeave={() => setHoveredIndex(null)}
                animate={{
                  scale: hoveredIndex === 3 ? 2 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Link
                  href={"/(tabs)/creator"}
                  aria-label={"brands"}
                  className="block rounded-full bg-[#38C02B] p-2  transition-colors"
                >
                  <Image
                    alt="brands"
                    src="/images/loading.png"
                    width={24}
                    height={24}
                  />
                </Link>
                <AnimatePresence>
                  {hoveredIndex === 3 && (
                    <motion.span
                      className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      Creator
                    </motion.span>
                  )}
                </AnimatePresence>
                {path === "/(tabs)/creator" && (
                  <motion.div
                    className="absolute -bottom-2 left-1/2 h-1 w-1 rounded-full bg-white"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    layoutId="activeIndicator"
                  />
                )}
              </motion.div>

              {iconsTwo.map(({ Icon, href, label, id }) => (
                <motion.div
                  key={label}
                  className="group relative "
                  onMouseEnter={() => setHoveredIndex(id)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  animate={{
                    scale: hoveredIndex === id ? 1.5 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Link
                    href={href}
                    aria-label={label}
                    className="block rounded-full bg-[#38C02B] p-2  transition-colors"
                  >
                    <Icon className="h-6 w-6" />
                  </Link>
                  <AnimatePresence>
                    {hoveredIndex === id && (
                      <motion.span
                        className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {path === href && (
                    <motion.div
                      className="absolute -bottom-2 left-1/2 h-1 w-1 rounded-full bg-white"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      layoutId="activeIndicator"
                    />
                  )}
                </motion.div>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
