"use client";

import { Minus, Plus } from "lucide-react";

import { cn } from "~/lib/utils";

/** − [ n ] + : pick a whole number between `min` and `max`. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  disabled,
  className,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max: number;
  disabled?: boolean;
  className?: string;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.floor(Number.isFinite(n) ? n : min)));
  const btn = "flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-35";
  return (
    <div className={cn("inline-flex items-center rounded-xl border bg-card p-1", className)} role="group" aria-label="Quantity">
      <button type="button" className={btn} onClick={() => onChange(clamp(value - 1))} disabled={disabled || value <= min} aria-label="Decrease quantity">
        <Minus className="size-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className="display w-12 bg-transparent text-center text-3xl tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        aria-label="Quantity"
      />
      <button type="button" className={btn} onClick={() => onChange(clamp(value + 1))} disabled={disabled || value >= max} aria-label="Increase quantity">
        <Plus className="size-4" />
      </button>
    </div>
  );
}
