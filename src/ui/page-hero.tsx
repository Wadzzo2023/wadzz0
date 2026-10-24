import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

export type HeroStat = { icon: LucideIcon; label: string; value: ReactNode };

const TILE = ["bg-primary text-primary-foreground -rotate-2", "bg-side-mint text-side-ink rotate-1", "bg-pink text-side-ink -rotate-1"];

/**
 * A page's opening banner, FC88-style: a marker eyebrow, the title in giant
 * condensed type, a hand-written line, the stats as tilted coloured blobs
 * with huge numbers, and (when given) the cover as a tilted sticker.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  image,
  stats = [],
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  image?: string | null;
  stats?: HeroStat[];
}) {
  return (
    <header className="mx-auto grid grid-cols-[minmax(0,1fr)] w-full max-w-[88rem] items-end gap-8 px-4 pb-4 pt-10 sm:px-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:pt-14">
      <div className="flex min-w-0 items-end gap-6">
        <div className="min-w-0 space-y-3">
          <p className="marker -rotate-2 text-base text-muted-foreground">*{eyebrow.toLowerCase()}*</p>
          <h1 className="display break-words text-5xl sm:text-6xl lg:text-7xl xl:text-8xl">{title}</h1>
          {description && <p className="marker max-w-xl -rotate-1 text-base leading-snug text-primary sm:text-lg">{description}</p>}
        </div>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="blob hidden size-36 shrink-0 rotate-6 border-[3px] border-foreground object-cover shadow-[6px_7px_0_0_hsl(var(--primary))] xl:block" />
        )}
      </div>
      {stats.length > 0 && (
        <dl className="grid grid-cols-3 gap-2 sm:gap-3 lg:w-[30rem]">
          {stats.map((s, i) => (
            <div key={s.label} className={cn("blob min-w-0 p-3 sm:p-4", TILE[i % TILE.length])}>
              <s.icon className="mb-1 size-4" strokeWidth={2.6} />
              <dd className="display truncate text-2xl tabular-nums sm:text-3xl lg:text-4xl">{s.value}</dd>
              <dt className="truncate text-[10px] font-bold uppercase tracking-wider opacity-75">{s.label}</dt>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}
