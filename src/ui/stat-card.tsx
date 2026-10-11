import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

/** A single number with its label (dashboards, report headers). */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  active,
  onClick,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1 rounded-xl border bg-card p-4 text-left transition-colors",
        onClick && "hover:border-line-bright",
        active && "border-primary/50 bg-primary/5",
        className,
      )}
    >
      <span className="flex items-center gap-1.5 font-hud text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </span>
      <span className="font-hud text-2xl font-bold tabular-nums text-foreground">{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </Comp>
  );
}
