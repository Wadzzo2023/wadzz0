import { Loader2 } from "lucide-react";

import { cn } from "~/lib/utils";

/** The one busy indicator (same Loader2 spin as the fan apps). */
export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return <Loader2 role="status" aria-label={label} className={cn("size-5 animate-spin text-primary", className)} />;
}

/** A centred spinner that fills its container — for whole-page/section waits. */
export function CenteredSpinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn("flex min-h-[40vh] w-full items-center justify-center", className)}>
      <Spinner className="size-6" label={label} />
    </div>
  );
}
