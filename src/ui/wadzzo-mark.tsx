import { cn } from "~/lib/utils";

/**
 * The Wadzzo "W" logo as a mask, so it takes the surrounding text colour
 * (the artwork itself is green, which would vanish on green stickers).
 * Sized by height; the width follows the logo's 5:4 shape.
 */
export function WadzzoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-4 bg-current align-middle", className)}
      style={{
        aspectRatio: "5 / 4",
        WebkitMaskImage: "url(/images/loading.png)",
        maskImage: "url(/images/loading.png)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
