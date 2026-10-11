"use client";

import { formatTokenNumber, formatUsdAmount, useCurrency } from "~/hooks/use-currency";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { cn } from "~/lib/utils";

const SIZES = {
  xs: { main: "text-xs", unit: "text-[10px]", sub: "text-[10px]" },
  sm: { main: "text-sm", unit: "text-[11px]", sub: "text-[11px]" },
  md: { main: "text-lg", unit: "text-xs", sub: "text-xs" },
  lg: { main: "text-2xl", unit: "text-sm", sub: "text-sm" },
  xl: { main: "text-4xl", unit: "text-lg", sub: "text-sm" },
} as const;

/**
 * A price in the viewer's chosen currency: that one big and bold, the other
 * small underneath (or beside it when `inline`). `usd` is the amount's own
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
  const { currency } = useCurrency();
  const s = SIZES[size];
  const hasUsd = usd != null;
  const usdFirst = currency === "USD" && hasUsd;

  const main = usdFirst ? (
    <span className={cn("font-hud font-bold tabular-nums", s.main, gradient && "text-gradient")}>{formatUsdAmount(usd)}</span>
  ) : (
    <span className={cn("font-hud font-bold tabular-nums", s.main)}>
      <span className={cn(gradient && "text-gradient")}>{formatTokenNumber(tokens)}</span> <span className={cn("font-semibold text-primary", s.unit)}>{code}</span>
    </span>
  );
  const sub = !secondary ? null : usdFirst ? `${formatTokenNumber(tokens)} ${code}` : hasUsd ? `≈ ${formatUsdAmount(usd)}` : null;

  return (
    <span className={cn(inline ? "inline-flex flex-wrap items-baseline gap-x-1.5" : "flex flex-col", "min-w-0", className)}>
      <span className="truncate leading-tight">{main}</span>
      {sub && <span className={cn("truncate tabular-nums text-muted-foreground", s.sub)}>{sub}</span>}
    </span>
  );
}

/** Plain text price in the chosen currency (for buttons and sentences). */
export function usePriceText() {
  const { currency } = useCurrency();
  return (tokens: number, usd: number | null | undefined, code = PLATFORM_ASSET.code) =>
    currency === "USD" && usd != null ? formatUsdAmount(usd) : `${formatTokenNumber(tokens)} ${code}`;
}
