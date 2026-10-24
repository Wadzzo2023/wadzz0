import { cn } from "~/lib/utils";

/**
 * A Stellar-style mark for XLM: a ring crossed by a diagonal trail, drawn in
 * the surrounding text colour (the project ships no Stellar artwork).
 */
export function XlmMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden className={cn("size-4 shrink-0", className)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M2 17.5 22 7.5" />
      <path d="M8 5.2v3.6M6.2 7h3.6" strokeWidth={1.8} />
    </svg>
  );
}
