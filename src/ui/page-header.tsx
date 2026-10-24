import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

/**
 * Every page's top: optional back link, eyebrow, title, one-line description,
 * and actions on the right (stacking under the title on phones).
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  back,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  back?: { href: string; label: string };
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="mb-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
            {back.label}
          </Link>
        )}
        {eyebrow && (
          <p className="marker mb-2 -rotate-2 text-base text-muted-foreground">*{eyebrow.toLowerCase()}*</p>
        )}
        <h1 className="display break-words text-[2.75rem] text-foreground sm:text-6xl lg:text-7xl">{title}</h1>
        {description && <p className="marker mt-3 max-w-2xl -rotate-1 text-base leading-snug text-primary sm:text-lg">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Standard page body: max width and padding. */
export function PageBody({ children, className, wide = false }: { children: ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className={cn("mx-auto w-full animate-rise px-4 pb-16 pt-8 sm:px-10 lg:pt-12", wide ? "max-w-[88rem]" : "max-w-5xl", className)}>
      {children}
    </div>
  );
}
