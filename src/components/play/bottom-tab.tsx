"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Book, Pen, Trophy, User } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const iconsOne = [
  { id: 1, Icon: Home, href: "/play/map", label: "Maps" },

  { id: 2, Icon: Book, href: "/play/collections", label: "Collection" },
];
const iconsTwo = [
  { id: 4, Icon: Trophy, href: "/play/bounty", label: "Bounty" },

  { id: 5, Icon: User, href: "/play/profile", label: "Profile" },
];

export const BottomTab = () => {
  const path = usePathname();
  const dockRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <header className=" absolute bottom-0 z-50  w-full  pt-6">
      <div className="">
        <div className="flex  items-center justify-between rounded-t-xl bg-[#38C02B]  p-2  md:border ">
          <div className="w-full">
            <nav
              className="flex justify-center gap-8 rounded-t-xl bg-[#38C02B]  text-sm md:rounded-none md:p-0 "
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
                    className="block p-2  transition-colors"
                  >
                    <Icon className="h-6 w-6" />
                  </Link>

                  {path === href && (
                    <motion.div
                      className="absolute bottom-1 left-1/2 h-1 w-1 rounded-full bg-white"
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
                  scale: hoveredIndex === 3 ? 1.5 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Link
                  href={"/play/creators"}
                  aria-label={"brands"}
                  className="block rounded-full bg-[#38C02B] p-2  transition-colors"
                >
                  <Image
                    alt="brands"
                    src="/images/wadzzo.png"
                    width={24}
                    height={24}
                  />
                </Link>

                {path === "/(tabs)/creator" && (
                  <motion.div
                    className="absolute bottom-1 left-1/2 h-1 w-1 rounded-full bg-white"
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
                    className="block  p-2  transition-colors"
                  >
                    <Icon className="h-6 w-6" />
                  </Link>

                  {path === href && (
                    <motion.div
                      className="absolute bottom-1 left-1/2 h-1 w-1 rounded-full bg-white"
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
