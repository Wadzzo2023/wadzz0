import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

/** A titled block on a page: giant condensed title, a marker-pen line under it, and a "See all" arrow. */
export function Section({
  title,
  description,
  href,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  href?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-6", className)}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="display flex items-center gap-3 text-[2.6rem] sm:text-5xl">
            {Icon && <Icon className="size-8 shrink-0 text-primary sm:size-9" strokeWidth={2.4} />}
            <span className="min-w-0 break-words">{title}</span>
          </h2>
          {description && <p className="marker mt-1.5 -rotate-1 text-base text-primary">{description}</p>}
        </div>
        {action ??
          (href && (
            <Link
              href={href}
              className="group inline-flex shrink-0 items-center gap-2.5"
            >
              <span className="display hidden text-xl sm:block">See all</span>
              <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-200 group-hover:-rotate-45">
                <ArrowRight className="size-5" strokeWidth={2.6} />
              </span>
            </Link>
          ))}
      </div>
      {children}
    </section>
  );
}

/** A row that scrolls sideways on phones and becomes a grid on wider screens. */
export function Rail({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 pt-3 sm:mx-0 sm:pt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4 2xl:grid-cols-5 [&>*]:w-[44%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}
