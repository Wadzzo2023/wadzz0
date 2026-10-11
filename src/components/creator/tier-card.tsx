import { Check, Crown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

/** Tier colors are palette names stored on the tier; each maps to theme-safe classes. */
export const TIER_COLORS = {
  green: { ring: "border-primary/50", chip: "bg-primary/12 text-primary", bar: "bg-primary" },
  blue: { ring: "border-info/50", chip: "bg-info/12 text-info", bar: "bg-info" },
  purple: { ring: "border-rarity-epic/50", chip: "bg-rarity-epic/12 text-rarity-epic", bar: "bg-rarity-epic" },
  gold: { ring: "border-rarity-legendary/50", chip: "bg-rarity-legendary/12 text-rarity-legendary", bar: "bg-rarity-legendary" },
  rose: { ring: "border-rarity-mythic/50", chip: "bg-rarity-mythic/12 text-rarity-mythic", bar: "bg-rarity-mythic" },
  slate: { ring: "border-line-bright", chip: "bg-muted text-muted-foreground", bar: "bg-muted-foreground" },
} as const;
export type TierColor = keyof typeof TIER_COLORS;
export const tierColor = (c: string) => TIER_COLORS[(c in TIER_COLORS ? c : "green") as TierColor];

export type Tier = { id: number; name: string; description: string; features: string[]; color: string; popular: boolean; price: number };

/** One membership tier: name, what it takes (page tokens held), perks, and the viewer's status. */
export function TierCard({ tier, code, current, reached, action }: { tier: Tier; code: string; current: boolean; reached: boolean; action?: ReactNode }) {
  const c = tierColor(tier.color);
  return (
    <div className={cn("glass relative flex flex-col overflow-hidden rounded-2xl p-5", (current || tier.popular) && c.ring, current && "glow")}>
      <div className={cn("absolute inset-x-0 top-0 h-1 rounded-t-2xl", c.bar)} />
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-hud text-lg font-bold">{tier.name}</h3>
        {current ? (
          <span className="rounded-full tone-success px-2 py-0.5 text-[11px] font-semibold">Your tier</span>
        ) : tier.popular ? (
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", c.chip)}>
            <Crown className="size-3" /> Popular
          </span>
        ) : null}
      </div>
      <p className="mt-1 font-hud text-2xl font-bold tabular-nums">
        {tier.price.toLocaleString("en-US")} <span className="text-sm font-medium text-muted-foreground">{code}</span>
      </p>
      <p className="text-xs text-muted-foreground">page tokens held</p>
      {tier.description && <p className="mt-3 text-sm text-muted-foreground">{tier.description}</p>}
      {tier.features.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {tier.features.map((f) => (
            <li key={f} className="flex gap-2">
              <Check className={cn("mt-0.5 size-4 shrink-0", reached ? "text-primary" : "text-muted-foreground")} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
      {action && <div className="mt-auto pt-4">{action}</div>}
    </div>
  );
}
