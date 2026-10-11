"use client";

import { DollarSign } from "lucide-react";

import { useCurrency, type DisplayCurrency } from "~/hooks/use-currency";
import { cn } from "~/lib/utils";

/** Header switch between showing prices in Wadzzo or USD first. */
export function CurrencyToggle({ className }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  const options: { id: DisplayCurrency; label: React.ReactNode; title: string }[] = [
    { id: "TOKEN", label: <span className="font-hud text-[13px] font-bold leading-none">W</span>, title: "Show prices in Wadzzo" },
    { id: "USD", label: <DollarSign className="size-3.5" strokeWidth={2.6} />, title: "Show prices in USD" },
  ];
  return (
    <div role="radiogroup" aria-label="Price currency" className={cn("relative flex h-9 items-center rounded-full bg-surface-2 p-1 ring-1 ring-foreground/[0.08]", className)}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={currency === o.id}
          title={o.title}
          onClick={() => setCurrency(o.id)}
          className={cn(
            "flex h-7 min-w-7 items-center justify-center rounded-full px-2 transition-all",
            currency === o.id ? "bg-primary text-primary-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.35),0_0_14px_-3px_hsl(var(--primary)/0.8)]" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
