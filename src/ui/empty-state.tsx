import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

/** "Nothing here yet" — icon, title, one line, and the action that fixes it. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative flex flex-col items-center justify-center overflow-hidden rounded-[1.6rem] border-[3px] border-dashed border-foreground/15 px-6 py-16 text-center", className)}>
      <div className="blob relative mb-5 flex size-16 -rotate-6 items-center justify-center bg-primary text-primary-foreground">
        <Icon className="size-7" strokeWidth={2.4} />
      </div>
      <h3 className="display relative text-4xl text-foreground">{title}</h3>
      {description && <p className="marker relative mt-2 max-w-sm -rotate-1 text-base text-primary">{description}</p>}
      {action && <div className="relative mt-6">{action}</div>}
    </div>
  );
}
