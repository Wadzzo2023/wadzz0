import { formatTokenNumber, formatUsdAmount } from "~/lib/money";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { cn } from "~/lib/utils";
import { WadzzoMark } from "~/ui/wadzzo-mark";

const SIZES = {
  xs: { main: "text-base", unit: "text-[10px]", sub: "text-[10px]" },
  sm: { main: "text-xl", unit: "text-[11px]", sub: "text-[11px]" },
  md: { main: "text-3xl", unit: "text-xs", sub: "text-xs" },
  lg: { main: "text-4xl", unit: "text-sm", sub: "text-sm" },
  xl: { main: "text-6xl", unit: "text-lg", sub: "text-sm" },
} as const;

/**
 * A price: Wadzzo big and bold, the dollar value small underneath (or beside
 * it when `inline`). `usd` is the amount's own
 * stored dollar value (a listing's priceUSD, a bounty's USD reward…); when
 * it's missing only the token amount shows.
 */
export function Price({
  tokens,
  usd,
  code = PLATFORM_ASSET.code,
  size = "sm",
  inline = false,
  secondary = true,
  gradient = false,
  className,
}: {
  tokens: number;
  usd: number | null | undefined;
  code?: string;
  size?: keyof typeof SIZES;
  inline?: boolean;
  secondary?: boolean;
  gradient?: boolean;
  className?: string;
}) {
  const s = SIZES[size];
  const main = (
    <span className={cn("display tabular-nums", s.main)}>
      <span className={cn(gradient && "text-primary")}>{formatTokenNumber(tokens)}</span>{" "}
      {code === PLATFORM_ASSET.code ? (
        <>
          <WadzzoMark className="h-[0.8em] text-primary" />
          <span className="sr-only">{code}</span>
        </>
      ) : (
        <span className={cn("font-sans font-bold text-primary", s.unit)}>{code}</span>
      )}
    </span>
  );
  const sub = secondary && usd != null ? `≈ ${formatUsdAmount(usd)}` : null;

  return (
    <span className={cn(inline ? "inline-flex flex-wrap items-baseline gap-x-1.5" : "flex flex-col", "min-w-0", className)}>
      <span className="leading-tight">{main}</span>
      {sub && <span className={cn("truncate tabular-nums text-muted-foreground", s.sub)}>{sub}</span>}
    </span>
  );
}

/** Plain text price (for buttons and sentences). */
export const priceText = (tokens: number, code = PLATFORM_ASSET.code) => `${formatTokenNumber(tokens)} ${code}`;
