import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Avatar } from "~/ui/person";
import type { RouterOutputs } from "~/utils/api";

import { creatorHref } from "./creator-card";

type Creator = RouterOutputs["creator"]["list"]["items"][number];

/** A sideways row of creator avatars (stories-style), linking to each brand. */
export function CreatorStrip({ creators }: { creators: Creator[] }) {
  return (
    <section aria-label="Creators" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-hud text-lg font-bold tracking-tight">Creators</h2>
        <Link href="/creators" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          See all <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {creators.map((c) => (
          <Link key={c.id} href={creatorHref(c)} className="group flex w-20 shrink-0 flex-col items-center gap-1.5 text-center">
            <span className="rounded-full bg-gradient-to-tr from-primary via-green-hot to-cyan-400 p-[2px] transition-transform group-hover:scale-105">
              <span className="block rounded-full bg-background p-[2px]">
                <Avatar src={c.profileUrl} name={c.name} className="size-16 text-lg" />
              </span>
            </span>
            <span className="w-full truncate text-xs font-medium">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
