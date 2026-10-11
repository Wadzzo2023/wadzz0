import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

/**
 * Small labels from wadzzoAR's design system (the bounty screens share it).
 */
export function Chip({
  children,
  active,
  onClick,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      onClick={onClick}
      aria-pressed={onClick ? active : undefined}
      className={cn(
        "font-hud inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors",
        active
          ? "border-ar-green/60 bg-ar-green/15 text-ar-green-hot shadow-[0_0_16px_-6px_hsl(var(--ar-green)/0.9)]"
          : "border-ar-line bg-white/[0.04] text-ar-dim hover:text-ar-text",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Label + number, used across profile, brand, and collection headers. */
export function StatBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={cn(
          "font-hud text-[19px] font-bold leading-none tabular-nums",
          accent ? "text-ar-green-hot text-glow-soft" : "text-ar-text",
        )}
      >
        {value}
      </span>
      <span className="font-hud text-[9px] font-semibold uppercase tracking-[0.18em] text-ar-faint">
        {label}
      </span>
    </div>
  );
}
