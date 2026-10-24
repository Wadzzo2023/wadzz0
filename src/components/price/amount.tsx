import { formatAmount } from "~/lib/stellar/quote";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { cn } from "~/lib/utils";
import { WadzzoMark } from "~/ui/wadzzo-mark";

/**
 * An amount in any currency. Wadzzo amounts show the number followed by the
 * Wadzzo "W" logo instead of the word; XLM and USD keep their usual text.
 * The logo takes the surrounding text colour and scales with the font size.
 */
export function Amount({ value, currency, className }: { value: number; currency: string; className?: string }) {
  if (currency !== PLATFORM_ASSET.code) return <span className={className}>{formatAmount(value, currency)}</span>;
  const number = formatAmount(value, currency).slice(0, -(currency.length + 1));
  return (
    <span className={cn("inline-flex items-center gap-[0.25em] whitespace-nowrap", className)} title={`${number} ${currency}`}>
      {number}
      <WadzzoMark className="h-[0.9em]" />
      <span className="sr-only">{currency}</span>
    </span>
  );
}

/** Just the currency name for sentences like "You have 5 ⟨W⟩": the Wadzzo logo for the platform token, the code as text for anything else. */
export function TokenCode({ code, className }: { code: string; className?: string }) {
  if (code !== PLATFORM_ASSET.code) return <span className={className}>{code}</span>;
  return (
    <span className={cn("inline-flex items-center align-middle", className)}>
      <WadzzoMark className="h-[0.95em]" />
      <span className="sr-only">{code}</span>
    </span>
  );
}
