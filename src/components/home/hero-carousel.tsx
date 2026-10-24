"use client";

import { ArrowRight, ChevronLeft, ChevronRight, Eye, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { MEDIA_META } from "~/components/media/media-meta";
import { formatTokenNumber, formatTokenShort, formatUsdShort } from "~/lib/money";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { cn } from "~/lib/utils";
import type { ListingCard } from "~/server/api/routers/market";
import { artChip } from "~/ui/styles";
import { WadzzoMark } from "~/ui/wadzzo-mark";

const INTERVAL_MS = 7000;
const ease = [0.2, 0.8, 0.2, 1] as const;

/**
 * Featured drops, FC88-style: a marker note, the name in giant condensed
 * type, the price as a huge number with stacked words beside it, a
 * hand-written line, chunky tilted buttons and the art as a tilted sticker.
 * Tabs underneath jump between slides (a bar fills until the next one).
 * Only opacity/transform animate, and only when the slide changes.
 */
export function HeroCarousel({ slides }: { slides: ListingCard[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touchX, setTouchX] = useState<number | null>(null);
  const n = slides.length;
  const go = useCallback((to: number) => setI(((to % n) + n) % n), [n]);

  useEffect(() => {
    if (paused || n < 2) return;
    const t = setTimeout(() => go(i + 1), INTERVAL_MS);
    return () => clearTimeout(t);
  }, [i, paused, n, go]);

  if (!n) return null;
  const s = slides[i]!;
  const a = s.asset;
  const meta = MEDIA_META[a.mediaType];
  const resale = s.placerId !== a.creatorId;
  const href = resale ? `/item/${a.id}?listing=${s.id}` : `/item/${a.id}`;
  const left = a.limit != null ? Math.max(0, a.limit - a.mintedCount) : null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured drops"
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => setTouchX(e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const end = e.changedTouches[0]?.clientX;
        if (touchX != null && end != null && Math.abs(end - touchX) > 40) go(i + (end < touchX ? 1 : -1));
        setTouchX(null);
      }}
    >
      <div className="mx-auto grid min-h-[min(84svh,760px)] max-w-[88rem] grid-cols-[minmax(0,1fr)] grid-rows-[1fr_auto] px-4 pt-8 sm:px-10 lg:pt-12">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14">
          {/* art sticker (first on phones) */}
          <div className="relative order-first flex justify-center lg:order-last">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={s.id}
                initial={{ opacity: 0, rotate: 8, y: 30 }}
                animate={{ opacity: 1, rotate: 3, y: 0 }}
                exit={{ opacity: 0, rotate: -4, y: -20 }}
                transition={{ duration: 0.45, ease }}
                className="relative w-[min(70vw,19rem)] sm:w-[22rem] lg:w-full lg:max-w-[27rem]"
              >
                <Link href={href} tabIndex={-1} className="group block">
                  <div className="blob relative overflow-hidden border-[3px] border-foreground bg-surface shadow-[10px_12px_0_0_hsl(var(--primary))] transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-3deg]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.thumbnail} alt={a.name} className="aspect-square w-full object-cover" />
                    <span className={cn(artChip, "absolute top-3 right-3")} title={meta.label}>
                      <meta.icon className="size-3.5" /> {meta.label}
                    </span>
                  </div>
                </Link>
                <span className="marker pointer-events-none absolute -left-4 -top-5 -rotate-12 rounded-lg bg-pink px-2.5 py-1 text-sm text-side-ink sm:-left-8">
                  {resale ? "fan resale!" : left === 0 ? "sold out!" : left != null && left <= 10 ? `only ${left} left!` : "fresh drop!"}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* details */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={s.id}
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{ show: { transition: { staggerChildren: 0.05 } } }}
              className="min-w-0 space-y-6 pb-4"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${n}: ${a.name}`}
            >
              <Rise>
                <h2 className="display line-clamp-3 break-words text-[3.4rem] sm:text-7xl xl:text-[5.6rem]">{a.name}</h2>
              </Rise>

              <Rise>
                <div className="blob inline-block -rotate-2 bg-primary px-5 py-3 text-primary-foreground" title={`${formatTokenNumber(s.price)} ${PLATFORM_ASSET.code}`}>
                  <p className="flex items-center gap-3">
                    <span className="display text-[3.8rem] leading-[0.85] tabular-nums sm:text-[5rem]">{formatTokenShort(s.price, 10_000_000)}</span>
                    <WadzzoMark className="h-11 sm:h-14" />
                    <span className="sr-only">{PLATFORM_ASSET.code}</span>
                  </p>
                  <p className="marker mt-1.5 text-sm sm:text-base">
                    {s.priceUSD != null && `≈ ${formatUsdShort(s.priceUSD, 10_000_000)} · `}
                    {resale ? "to buy it" : "to mint it"}
                  </p>
                </div>
              </Rise>

              <Rise className="flex flex-wrap items-center gap-3">
                <Link
                  href={href}
                  className="blob tilt-l inline-flex h-14 items-center gap-2.5 bg-primary px-7 text-primary-foreground transition-transform duration-200 hover:rotate-0 hover:scale-[1.03]"
                >
                  {!resale && left === 0 ? <Eye className="size-5" strokeWidth={2.6} /> : <Zap className="size-5 fill-current" />}
                  <span className="marker text-lg">{resale ? "Buy now" : left === 0 ? "View item" : "Mint now"}</span>
                </Link>
                <Link href="/marketplace" className="blob tilt-r inline-flex h-14 items-center gap-2.5 bg-surface-3 px-6 transition-transform duration-200 hover:rotate-0 hover:scale-[1.03]">
                  <span className="marker text-lg">Explore market</span>
                  <ArrowRight className="size-5" strokeWidth={2.6} />
                </Link>
              </Rise>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* slide dots (the active one stretches and fills until the next slide) */}
        {n > 1 && (
          <div className="flex items-center justify-between gap-3 pb-8 pt-6">
            <div className="flex items-center gap-2" role="tablist" aria-label="Featured drops">
              {slides.map((t, idx) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  onClick={() => go(idx)}
                  aria-label={`Show ${t.asset.name}`}
                  aria-selected={idx === i}
                  className={cn("relative h-3 overflow-hidden rounded-full transition-[width,background-color] duration-300", idx === i ? "w-12 bg-foreground/20" : "w-3 bg-foreground/30 hover:bg-foreground/60")}
                >
                  {idx === i && <span key={`${i}-${paused}`} className={cn("absolute inset-0 origin-left rounded-full bg-primary", paused ? "scale-x-100" : "animate-[hero-progress_7s_linear]")} />}
                </button>
              ))}
            </div>
            <div className="hidden gap-2 sm:flex">
              <button type="button" onClick={() => go(i - 1)} aria-label="Previous slide" className="flex size-12 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:-rotate-12">
                <ChevronLeft className="size-6" strokeWidth={2.6} />
              </button>
              <button type="button" onClick={() => go(i + 1)} aria-label="Next slide" className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:rotate-12">
                <ChevronRight className="size-6" strokeWidth={2.6} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Rise({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } }} className={className}>
      {children}
    </motion.div>
  );
}
