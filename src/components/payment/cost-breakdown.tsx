import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown } from "lucide-react";
import Link from "next/link";

import { Button } from "~/components/shadcn/ui/button";
import { cn } from "~/lib/utils";
import { Amount } from "~/components/price/amount";
import { type CostLine, type Problem } from "~/lib/stellar/quote";

/**
 * Every line of what an action costs, the total, and the payer's balance.
 * `collapsible`: show only the total until "See breakdown" is opened.
 * `part` splits it in two so the lines and the total can sit in different places.
 */
export function CostBreakdown({
  lines,
  total,
  currency,
  balance,
  collapsible = false,
  part = "all",
  className,
}: {
  lines: CostLine[];
  total: number;
  currency: string;
  balance?: number | null;
  collapsible?: boolean;
  /** `lines`: only the itemised costs; `total`: only the total and balance (to place them apart). */
  part?: "all" | "lines" | "total";
  className?: string;
}) {
  const rows = (
    <dl className="space-y-2 text-sm">
      {lines.map((l) => (
        <div key={l.key + l.label} className="flex items-start justify-between gap-3">
          <dt className="min-w-0">
            <span className={cn(!l.inTotal && "text-muted-foreground")}>{l.label}</span>
            {l.hint && <span className="block text-xs text-muted-foreground">{l.hint}</span>}
          </dt>
          <dd className={cn("shrink-0 font-medium tabular-nums", !l.inTotal && "text-muted-foreground")}><Amount value={l.amount} currency={l.currency} /></dd>
        </div>
      ))}
    </dl>
  );
  const totals = (
    <dl className="space-y-1 text-sm">
      <div className="flex items-center justify-between gap-3">
        <dt className="display text-2xl">Total</dt>
        <dd className="display text-3xl tabular-nums text-primary"><Amount value={total} currency={currency} /></dd>
      </div>
      {balance != null && (
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <dt>Your balance</dt>
          <dd className={cn("tabular-nums", balance < total && "font-semibold text-destructive")}><Amount value={balance} currency={currency} /></dd>
        </div>
      )}
    </dl>
  );

  if (part === "lines")
    return (
      <div className={cn("rounded-[1.2rem] border-2 border-dashed border-foreground/15 p-4", className)}>
        <p className="label-caps mb-3">Cost breakdown</p>
        {rows}
      </div>
    );

  if (part === "total") return <div className={cn("rounded-[1.2rem] border-2 border-dashed border-foreground/15 p-4", className)}>{totals}</div>;

  if (collapsible) {
    return (
      <details className={cn("group rounded-[1.2rem] border-2 border-dashed border-foreground/15 p-3.5", className)}>
        {/* closed: only the total shows; the hint lives in <summary> so it stays visible */}
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          {totals}
          <span className="marker mt-1.5 flex items-center justify-center gap-1 text-xs text-primary">
            <span className="group-open:hidden">See breakdown</span>
            <span className="hidden group-open:inline">Hide breakdown</span>
            <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
          </span>
        </summary>
        <div className="mt-3 border-t-2 border-dashed border-foreground/10 pt-3">{rows}</div>
      </details>
    );
  }

  return (
    <div className={cn("rounded-[1.2rem] border-2 border-dashed border-foreground/15 p-4", className)}>
      <p className="label-caps mb-3">Cost breakdown</p>
      {rows}
      <div className="mt-2.5 border-t-2 border-dashed border-foreground/10 pt-2.5">{totals}</div>
    </div>
  );
}

const ACTION: Record<NonNullable<Problem["action"]>, { label: string; href?: string }> = {
  recharge: { label: "Add funds", href: "/wallet" },
  follow: { label: "Follow creator" },
  join_tier: { label: "See membership tiers" },
};

/** Why an action can't go through yet, each with what to do about it. */
export function ProblemList({ problems, creatorHref, onFollow }: { problems: Problem[]; creatorHref?: string; onFollow?: () => void }) {
  if (!problems.length) {
    return (
      <p className="flex items-center gap-2 rounded-xl tone-success px-3 py-2 text-sm font-bold">
        <CheckCircle2 className="size-4" /> Ready — this transaction will go through.
      </p>
    );
  }
  return (
    <ul className="space-y-2" aria-live="polite">
      {problems.map((p) => {
        const action = p.action ? ACTION[p.action] : null;
        const href = p.action === "join_tier" ? (creatorHref ? `${creatorHref}?tab=membership` : undefined) : action?.href;
        return (
          <li key={p.code} className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm sm:flex-row sm:items-center">
            <span className="flex min-w-0 flex-1 items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <span>{p.message}</span>
            </span>
            {action &&
              (p.action === "follow" && onFollow ? (
                <Button size="sm" variant="outline" onClick={onFollow}>
                  {action.label}
                </Button>
              ) : href ? (
                <Button size="sm" variant="outline" asChild>
                  <Link href={href}>
                    {action.label} <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              ) : null)}
          </li>
        );
      })}
    </ul>
  );
}
