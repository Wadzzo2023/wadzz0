import Image from "next/image";
import Link from "next/link";

import { cn } from "~/lib/utils";

/** Logo + wordmark (the same mark the brand portal and fan apps use). */
export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="Wadzzo home">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Image src="/images/loading.png" alt="" width={22} height={22} className="object-contain" priority />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block font-hud text-base font-bold tracking-tight">Wadzzo</span>
          <span className="block font-hud text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Collect · Trade · Play</span>
        </span>
      )}
    </Link>
  );
}
