import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const BLANK_KEYWORD = "BLANK";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no 0/O/1/I to avoid confusion

export function generateRedeemCode(): string {
  return Array.from({ length: 6 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join("")
}
export function fmt(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function fmtShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short", day: "numeric",
  });
}

export function fmtDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/** Derive pin status from DB fields. */
export function derivePinStatus(
  endDate: string | null,
  remaining: number,
  limit: number,
): "active" | "expired" | "fully_claimed" | "collection_disabled" {
  if (limit === 0) return "collection_disabled";
  if (remaining === 0) return "fully_claimed";
  if (endDate && new Date(endDate) < new Date()) return "expired";
  return "active";
}
