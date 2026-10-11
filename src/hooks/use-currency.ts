"use client";

import { useSyncExternalStore } from "react";

/** Which currency prices are shown in first. Saved per browser; Wadzzo by default. */
export type DisplayCurrency = "TOKEN" | "USD";

const KEY = "wadzzo-currency";
const EVENT = "wadzzo-currency-change";

function read(): DisplayCurrency {
  try {
    return localStorage.getItem(KEY) === "USD" ? "USD" : "TOKEN";
  } catch {
    return "TOKEN";
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function setDisplayCurrency(c: DisplayCurrency) {
  try {
    localStorage.setItem(KEY, c);
  } catch {
    /* private mode: still switches for this page */
  }
  window.dispatchEvent(new Event(EVENT));
}

/**
 * The chosen display currency. The server and the first client render always
 * use Wadzzo (so markup matches); a saved USD choice applies right after.
 * Amounts come with their own USD value (e.g. a listing's stored priceUSD) —
 * nothing is converted here.
 */
export function useCurrency() {
  const currency = useSyncExternalStore(subscribe, read, () => "TOKEN" as const);
  return { currency, setCurrency: setDisplayCurrency };
}

export const formatTokenNumber = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: n > 0 && n < 1 ? 4 : 2 });
export const formatUsdAmount = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: n > 0 && n < 0.01 ? 4 : 2 });
