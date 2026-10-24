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
        "group relative flex flex-col gap-1 overflow-hidden rounded-[1.4rem] border-2 border-foreground/10 bg-surface p-4 text-left transition-[transform,border-color] duration-200",
        onClick && "hover:-translate-y-0.5 hover:border-foreground",
        active && "border-primary bg-primary text-primary-foreground",
        className,
      )}
    >
      <span className={cn("relative flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider", active ? "text-primary-foreground/75" : "text-muted-foreground")}>
        {Icon && <Icon className={cn("size-3.5", !active && "text-primary")} strokeWidth={2.6} />}
        {label}
      </span>
      <span className="display relative text-4xl tabular-nums">{value}</span>
      {hint && <span className={cn("relative text-xs", active ? "text-primary-foreground/75" : "text-muted-foreground")}>{hint}</span>}
    </Comp>
  );
}
