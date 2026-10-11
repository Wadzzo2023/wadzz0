import Link from "next/link";

import { cn } from "~/lib/utils";
import { Avatar } from "~/ui/person";
import type { RouterOutputs } from "~/utils/api";

type CreatorCardData = RouterOutputs["creator"]["list"]["items"][number];

export const creatorHref = (c: { id: string; vanityURL?: string | null }) => `/creator/${c.vanityURL ?? c.id}`;

/** A brand in a list: cover, avatar, name, a line of bio and follower count. */
export function CreatorCard({ creator, className }: { creator: CreatorCardData; className?: string }) {
  return (
    <Link href={creatorHref(creator)} className={cn("group flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-line-bright", className)}>
      <div className="h-16 bg-gradient-to-br from-primary/25 to-primary/5">
        {creator.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={creator.coverUrl} alt="" loading="lazy" className="size-full object-cover" />
        )}
      </div>
      <div className="-mt-7 flex flex-1 flex-col items-center gap-1 px-3 pb-3 text-center">
        <Avatar src={creator.profileUrl} name={creator.name} className="size-14 border-4 border-card text-lg" />
        <p className="w-full truncate font-hud text-sm font-semibold">{creator.name}</p>
        {creator.bio && <p className="line-clamp-2 text-xs text-muted-foreground">{creator.bio}</p>}
        <p className="mt-auto pt-1 text-xs text-muted-foreground">
          {creator._count.followers.toLocaleString()} followers · {creator._count.posts} posts
        </p>
      </div>
    </Link>
  );
}
