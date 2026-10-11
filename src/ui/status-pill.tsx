import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "primary";

const TONE: Record<Tone, string> = {
  success: "tone-success",
  warning: "tone-warning",
  danger: "tone-danger",
  info: "tone-info",
  neutral: "tone-neutral",
  primary: "tone-primary",
};

/**
 * A state as a small rounded label: Live, In review, Banned… One component so
 * every page colours the same states the same way (tones live in globals.css).
 */
export function StatusPill({
  tone = "neutral",
  icon: Icon,
  dot,
  children,
  className,
}: {
  tone?: Tone;
  icon?: LucideIcon;
  /** A leading dot instead of an icon (for "live"-style states). */
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4", TONE[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {Icon && <Icon className="size-3" aria-hidden />}
      {children}
    </span>
  );
}
