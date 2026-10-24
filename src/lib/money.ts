/** Amounts are always shown in Wadzzo first, with the item's own stored USD value underneath. Nothing is converted here. */
export const formatTokenNumber = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: n > 0 && n < 1 ? 4 : 2 });
export const formatUsdAmount = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: n > 0 && n < 0.01 ? 4 : 2 });

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** Like `formatTokenNumber`, but amounts from `from` up become 250K / 1.2M / 1.5B (for tight spots like cards). */
export const formatTokenShort = (n: number, from = 100_000) => (n >= from ? compact.format(n) : formatTokenNumber(n));

/** Like `formatUsdAmount`, but amounts from `from` up become $250K / $1.2M. */
export const formatUsdShort = (n: number, from = 100_000) => (n >= from ? `$${compact.format(n)}` : formatUsdAmount(n));
