import Image from "next/image";
import Link from "next/link";

import { cn } from "~/lib/utils";

/** Logo on an ink badge + the stacked condensed wordmark, FC88-style. `compact` is the badge alone. */
export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-3", className)} aria-label="Wadzzo home">
      <span className="blob flex size-11 shrink-0 items-center justify-center bg-side-ink transition-transform duration-200 group-hover:-rotate-6">
        <Image src="/images/loading.png" alt="" width={26} height={22} style={{ width: 26, height: "auto" }} className="object-contain" priority />
      </span>
      {!compact && (
        <span className="leading-none text-side-ink">
          <span className="display block text-[2.1rem]">Wadzzo</span>
          <span className="marker block -rotate-2 whitespace-nowrap text-[10px] text-side-ink/75">collect · trade · play</span>
        </span>
      )}
    </Link>
  );
}
