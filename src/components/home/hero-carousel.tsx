"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { MEDIA_META } from "~/components/media/media-meta";
import { usePriceText } from "~/components/price/price";
import { Button } from "~/components/shadcn/ui/button";
import { cn } from "~/lib/utils";
import type { ListingCard } from "~/server/api/routers/market";
import { Avatar } from "~/ui/person";

const INTERVAL_MS = 6000;

/**
 * Featured drops as a full-width banner (about 40% of the screen): the art
 * fills the slide, the details sit over a gradient, and a thumbnail strip
 * jumps between slides. Advances on its own, pauses on hover, swipes on touch.
 */
export function HeroCarousel({ slides }: { slides: ListingCard[] }) {
  const [i, setI] = useState(0);
  const priceText = usePriceText();
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

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured drops"
      className="relative h-[40svh] min-h-[300px] w-full overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => setTouchX(e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const end = e.changedTouches[0]?.clientX;
        if (touchX != null && end != null && Math.abs(end - touchX) > 40) go(i + (end < touchX ? 1 : -1));
        setTouchX(null);
      }}
    >
      {slides.map((s, idx) => {
        const a = s.asset;
        const meta = MEDIA_META[a.mediaType];
        const active = idx === i;
        return (
          <div
            key={s.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${idx + 1} of ${n}: ${a.name}`}
            aria-hidden={!active}
            className={cn("absolute inset-0 transition-opacity duration-700", active ? "opacity-100" : "pointer-events-none opacity-0")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={a.thumbnail}
              alt=""
              className={cn("absolute inset-0 size-full object-cover transition-transform duration-[6000ms] ease-linear", active ? "scale-105" : "scale-100")}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

            <div className="relative mx-auto flex h-full max-w-7xl items-end px-4 pb-6 sm:px-6 sm:pb-8">
              <div className="max-w-xl space-y-2.5 text-white sm:space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
                  <meta.icon className="size-3.5" /> Featured {meta.label.toLowerCase()}
                </span>
                <h2 className="line-clamp-2 font-hud text-2xl font-bold leading-tight tracking-tight sm:text-4xl">{a.name}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {a.creator && (
                    <span className="flex items-center gap-2 text-sm text-white/85">
                      <Avatar src={a.creator.profileUrl} name={a.creator.name} className="size-6 text-[10px]" /> {a.creator.name}
                    </span>
                  )}
                  <Button asChild size="sm" tabIndex={active ? 0 : -1}>
                    <Link href={`/item/${a.id}`}>Buy · {priceText(s.price, s.priceUSD)}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {n > 1 && (
        <>
          {/* thumbnail strip on wider screens, dots on phones */}
          <div className="absolute bottom-6 right-4 hidden gap-2 sm:bottom-8 sm:right-6 md:flex">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(idx)}
                aria-label={`Show ${s.asset.name}`}
                aria-current={idx === i}
                className={cn("relative size-14 overflow-hidden rounded-lg ring-2 transition-all lg:size-16", idx === i ? "ring-white" : "opacity-60 ring-transparent hover:opacity-100")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.asset.thumbnail} alt="" className="size-full object-cover" />
                {idx === i && !paused && <span key={i} className="absolute inset-x-0 bottom-0 h-0.5 origin-left animate-[hero-progress_6s_linear] bg-primary" />}
              </button>
            ))}
          </div>
          <div className="absolute right-4 top-4 flex gap-1.5 md:hidden">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(idx)}
                aria-label={`Show slide ${idx + 1}`}
                aria-current={idx === i}
                className={cn("h-1.5 rounded-full transition-all", idx === i ? "w-5 bg-white" : "w-1.5 bg-white/50")}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(i - 1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:flex"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(i + 1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:flex"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
    </section>
  );
}
