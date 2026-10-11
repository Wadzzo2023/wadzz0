import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

/** A titled block on a page, with an optional "See all" link. */
export function Section({
  title,
  description,
  href,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  href?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-hud text-lg font-bold tracking-tight sm:text-xl">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action ??
          (href && (
            <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
              See all <ArrowRight className="size-3.5" />
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
        "-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4 2xl:grid-cols-5 [&>*]:w-[44%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}
