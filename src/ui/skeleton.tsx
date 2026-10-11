import { cn } from "~/lib/utils";

/**
 * Loading placeholders with the shared sweep (`.skeleton` in globals.css).
 * Each one copies the padding and grid of the page it stands in for, so
 * nothing jumps when the content arrives. Tables use DataTable's own
 * column-shaped loading rows instead.
 */

/** Shape-matched placeholder with the shared sweep. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("skeleton rounded-lg", className)} {...props} />;
}

/** A page while access is checked: PageBody padding, header, then a grid of cards. */
export function PageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-10" role="status" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** A create/edit page (FormPage): header + actions, section cards, and the side panel. */
export function FormSkeleton({ sections = 3, aside = true }: { sections?: number; aside?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-5 pb-40 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12" role="status" aria-label="Loading form">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="hidden gap-2 lg:flex">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className={cn("mt-6 grid gap-6", aside && "lg:grid-cols-[minmax(0,1fr)_380px]")}>
        <div className="space-y-5">
          {Array.from({ length: sections }).map((_, s) => (
            <div key={s} className="rounded-xl border bg-card p-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-2 h-3.5 w-64 max-w-full" />
              <div className="mt-5 space-y-4">
                {Array.from({ length: s === 0 ? 3 : 2 }).map((_, f) => (
                  <div key={f} className="space-y-2">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className={cn("w-full rounded-md", s === 0 && f === 1 ? "h-24" : "h-10")} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {aside && (
          <div className="space-y-5">
            <div className="rounded-xl border bg-card p-5">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-4 aspect-[4/3] w-full rounded-lg" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
