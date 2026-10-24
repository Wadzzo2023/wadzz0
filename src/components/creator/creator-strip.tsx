import { BadgeCheck, Users } from "lucide-react";
import Link from "next/link";

import { creatorHref } from "~/lib/creator";
import { Avatar } from "~/ui/person";
import type { RouterOutputs } from "~/utils/api";

type Creator = RouterOutputs["creator"]["list"]["items"][number];

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** A sideways rail of creator stickers: cover art on top, the avatar breaking out of it, name in condensed type and fans below. */
export function CreatorStrip({ creators }: { creators: Creator[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-3 pt-1 sm:-mx-10 sm:scroll-px-10 sm:px-10">
      {creators.map((c, idx) => (
        <Link
          key={c.id}
          href={creatorHref(c)}
          className="group relative w-40 shrink-0 snap-start overflow-hidden rounded-[1.4rem] border-2 border-foreground/10 bg-surface transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:rotate-1 hover:border-foreground hover:shadow-[5px_6px_0_0_hsl(var(--primary))] sm:w-48"
        >
          <div className="relative h-24 overflow-hidden sm:h-28">
            {c.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.coverUrl} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <div className="size-full bg-primary/25" />
            )}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
            <span className="display absolute left-2 top-2 rounded-md bg-side-ink px-1.5 py-0.5 text-sm text-side">#{idx + 1}</span>
          </div>
          <div className="relative -mt-8 flex flex-col items-center px-3 pb-3 text-center">
            <span className="rounded-full bg-primary p-[3px] transition-transform duration-200 group-hover:-rotate-6">
              <Avatar src={c.profileUrl} name={c.name} className="size-14 border-2 border-surface text-lg" />
            </span>
            <p className="display mt-2 flex w-full items-center justify-center gap-1 text-xl">
              <span className="truncate">{c.name}</span>
              <BadgeCheck className="size-3.5 shrink-0 text-primary" />
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3" /> {compact.format(c._count.followers)} fans
              {c.pageAsset && <span className="marker ml-1 text-primary">${c.pageAsset.code}</span>}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
