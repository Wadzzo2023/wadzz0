/**
 * Shapes shared by the server (which computes quotes) and the UI (which shows
 * them). Kept free of server imports so client components can use the types.
 */

export const BUY_METHODS = ["PLATFORM_ASSET", "XLM", "CARD"] as const;
export type BuyMethod = (typeof BUY_METHODS)[number];

export type CostLine = {
  key: "price" | "royalty" | "platformFee" | "networkFee" | "reserve";
  label: string;
  amount: number;
  currency: string;
  /** shown under the label, e.g. "Paid once per item; stays in your wallet" */
  hint?: string;
  /** false = not part of `total` (paid separately, e.g. a tiny XLM network fee) */
  inTotal: boolean;
};

export type ProblemCode =
  | "OWN_LISTING"
  | "NOT_FOR_SALE"
  | "NO_ACCESS"
  | "SOLD_OUT"
  | "ACCOUNT_INACTIVE"
  | "NO_PLATFORM_TRUST"
  | "INSUFFICIENT_FUNDS"
  | "INSUFFICIENT_XLM"
  | "TOO_MANY_ASSETS"
  | "SELLER_CANNOT_RECEIVE"
  | "MINT_UNAVAILABLE"
  | "PLATFORM_UNAVAILABLE"
  | "PRICE_UNAVAILABLE";

export type Problem = {
  code: ProblemCode;
  message: string;
  /** what the buyer can do about it */
  action?: "recharge" | "follow" | "join_tier";
};

export type Quote = {
  method: BuyMethod;
  /** currency of `total` */
  currency: string;
  lines: CostLine[];
  total: number;
  /** the buyer's balance in `currency` (null for card) */
  balance: number | null;
  /** where the copy comes from: existing stock, or minted for this buyer */
  source: "stock" | "mint";
  /** copies still obtainable (null = unlimited) */
  copiesLeft: number | null;
  needsTrustline: boolean;
  /** what the seller and the creator receive */
  payout: { seller: number; royalty: number; currency: string };
  ok: boolean;
  problems: Problem[];
};

/** Format an amount for display: up to 7 decimals for XLM, 2 otherwise. */
export function formatAmount(amount: number, currency: string) {
  const dp = currency === "XLM" ? 7 : 2;
  const s = amount.toLocaleString("en-US", { maximumFractionDigits: dp, minimumFractionDigits: currency === "USD" ? 2 : 0 });
  return currency === "USD" ? `$${s}` : `${s} ${currency}`;
}
