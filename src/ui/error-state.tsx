import { AlertTriangle } from "lucide-react";

import { Button } from "~/components/shadcn/ui/button";
import { cn } from "~/lib/utils";

/** A query failed: say so plainly and offer a retry. */
export function ErrorState({ message, onRetry, className }: { message?: string; onRetry?: () => void; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center", className)}>
      <AlertTriangle className="mb-3 size-6 text-destructive" />
      <p className="font-hud text-sm font-semibold">Something went wrong</p>
      {message && <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
