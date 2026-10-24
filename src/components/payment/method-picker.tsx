"use client";

import { Coins, CreditCard, Sparkles } from "lucide-react";

import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { cn } from "~/lib/utils";

export type PayMethod = "PLATFORM_ASSET" | "XLM" | "CARD";

const META: Record<PayMethod, { label: string; icon: typeof Coins }> = {
  PLATFORM_ASSET: { label: PLATFORM_ASSET.code, icon: Sparkles },
  XLM: { label: "XLM", icon: Coins },
  CARD: { label: "Card", icon: CreditCard },
};

/** Segmented choice of how to pay. */
export function MethodPicker({ value, onChange, methods }: { value: PayMethod; onChange: (m: PayMethod) => void; methods: PayMethod[] }) {
  return (
    <div className={cn("grid gap-1 rounded-2xl bg-surface-2 p-1", methods.length === 3 ? "grid-cols-3" : "grid-cols-2")} role="radiogroup" aria-label="Payment method">
      {methods.map((m) => {
        const Icon = META[m].icon;
        const active = m === value;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(m)}
            className={cn(
              "blob flex h-10 items-center justify-center gap-1.5 text-sm font-bold transition-colors",
              active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" /> {META[m].label}
          </button>
        );
      })}
    </div>
  );
}
