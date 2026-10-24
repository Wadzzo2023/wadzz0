"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "~/lib/utils";

/**
 * A titled row of cards that scrolls sideways: swipe on touch, arrow buttons
 * on wider screens. Items snap into place. `itemClassName` sets card width.
 */
export function Carousel({
  title,
  description,
  href,
  children,
  itemClassName = "w-[44%] sm:w-[30%] md:w-[23%] lg:w-[18.5%] xl:w-[15.5%]",
  className,
}: {
  title: string;
  description?: string;
  href?: string;
  children: ReactNode[];
  itemClassName?: string;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    el?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const page = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.9, behavior: "smooth" });

  return (
    <section className={cn("space-y-3", className)} aria-label={title}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="display text-3xl sm:text-4xl">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {href && (
            <Link href={href} className="mr-1 marker inline-flex items-center gap-1 text-sm text-primary hover:underline">
              See all <ArrowRight className="size-3.5" />
            </Link>
          )}
          <ArrowButton label="Previous" disabled={edge.start} onClick={() => page(-1)}>
            <ChevronLeft className="size-4" />
          </ArrowButton>
          <ArrowButton label="Next" disabled={edge.end} onClick={() => page(1)}>
            <ChevronRight className="size-4" />
          </ArrowButton>
        </div>
      </div>
      <div ref={track} className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:gap-4 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {children.map((child, i) => (
          <div key={i} className={cn("shrink-0 snap-start", itemClassName)}>
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}

function ArrowButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="hidden size-8 items-center justify-center rounded-full border bg-card text-foreground transition-colors hover:border-line-bright disabled:opacity-35 sm:flex"
    >
      {children}
    </button>
  );
}
