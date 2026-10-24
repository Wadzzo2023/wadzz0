/** Amounts are always shown in Wadzzo first, with the item's own stored USD value underneath. Nothing is converted here. */
export const formatTokenNumber = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: n > 0 && n < 1 ? 4 : 2 });
export const formatUsdAmount = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: n > 0 && n < 0.01 ? 4 : 2 });
