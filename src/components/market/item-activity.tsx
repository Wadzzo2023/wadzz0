"use client";

import { formatDistanceToNow } from "date-fns";

import { formatAmount } from "~/lib/stellar/quote";
import { Person } from "~/ui/person";
import { api } from "~/utils/api";

const LABEL = { PURCHASE: "Bought", RESALE_PURCHASE: "Bought (resale)", CLAIM: "Claimed", GIFT: "Gifted" } as const;

/** Recent sales and claims of an item. */
export function ItemActivity({ assetId }: { assetId: number }) {
  const activity = api.market.itemActivity.useQuery({ assetId });
  if (activity.isLoading) return <div className="skeleton h-32 rounded-xl" />;
  if (!activity.data?.length) return <p className="marker py-6 text-center text-base text-primary">no sales yet — be the first to own this!</p>;
  return (
    <section>
      <ul className="divide-y-2 divide-dashed divide-foreground/10">
        {activity.data.map((a) => (
          <li key={a.id} className="flex items-center gap-3 py-3">
            <Person name={a.buyer?.name} image={a.buyer?.image} id={a.buyer?.id} size="sm" sub={LABEL[a.type as keyof typeof LABEL] ?? a.type} className="flex-1" />
            {a.price > 0 && <span className="display text-xl tabular-nums">{formatAmount(a.price, a.currency)}</span>}
            <time className="w-24 text-right text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</time>
          </li>
        ))}
      </ul>
    </section>
  );
}
