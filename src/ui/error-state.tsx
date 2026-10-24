import { AlertTriangle } from "lucide-react";

import { Button } from "~/components/shadcn/ui/button";
import { cn } from "~/lib/utils";

/** A query failed: say so plainly and offer a retry. */
export function ErrorState({ message, onRetry, className }: { message?: string; onRetry?: () => void; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-[1.6rem] border-[3px] border-dashed border-destructive/50 px-6 py-12 text-center", className)}>
      <AlertTriangle className="mb-3 size-8 text-destructive" strokeWidth={2.4} />
      <p className="display text-4xl">Something went wrong</p>
      {message && <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
