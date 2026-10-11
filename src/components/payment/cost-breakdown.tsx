import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown } from "lucide-react";
import Link from "next/link";

import { Button } from "~/components/shadcn/ui/button";
import { cn } from "~/lib/utils";
import { formatAmount, type CostLine, type Problem } from "~/lib/stellar/quote";

/**
 * Every line of what an action costs, the total, and the payer's balance.
 * `collapsible`: show only the total until "See breakdown" is opened.
 */
export function CostBreakdown({
  lines,
  total,
  currency,
  balance,
  collapsible = false,
  className,
}: {
  lines: CostLine[];
  total: number;
  currency: string;
  balance?: number | null;
  collapsible?: boolean;
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
          <dd className={cn("shrink-0 font-medium tabular-nums", !l.inTotal && "text-muted-foreground")}>{formatAmount(l.amount, l.currency)}</dd>
        </div>
      ))}
    </dl>
  );
  const totals = (
    <dl className="space-y-1 text-sm">
      <div className="flex items-center justify-between gap-3">
        <dt className="font-hud font-semibold">Total</dt>
        <dd className="font-hud text-lg font-bold tabular-nums">{formatAmount(total, currency)}</dd>
      </div>
      {balance != null && (
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <dt>Your balance</dt>
          <dd className={cn("tabular-nums", balance < total && "font-semibold text-destructive")}>{formatAmount(balance, currency)}</dd>
        </div>
      )}
    </dl>
  );

  if (collapsible) {
    return (
      <details className={cn("group rounded-xl bg-foreground/[0.04] p-3.5 ring-1 ring-foreground/[0.06]", className)}>
        {/* closed: only the total shows; the hint lives in <summary> so it stays visible */}
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          {totals}
          <span className="mt-1.5 flex items-center justify-center gap-1 text-xs font-medium text-primary">
            <span className="group-open:hidden">See breakdown</span>
            <span className="hidden group-open:inline">Hide breakdown</span>
            <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
          </span>
        </summary>
        <div className="mt-3 border-t border-foreground/[0.08] pt-3">{rows}</div>
      </details>
    );
  }

  return (
    <div className={cn("rounded-xl bg-foreground/[0.04] p-4 ring-1 ring-foreground/[0.06]", className)}>
      <p className="label-caps mb-3">Cost breakdown</p>
      {rows}
      <div className="mt-2.5 border-t border-foreground/[0.08] pt-2.5">{totals}</div>
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
      <p className="flex items-center gap-2 rounded-lg tone-success px-3 py-2 text-sm font-medium">
        <CheckCircle2 className="size-4" /> Ready — this transaction will go through.
      </p>
    );
  }
  return (
    <ul className="space-y-2" aria-live="polite">
      {problems.map((p) => {
        const action = p.action ? ACTION[p.action] : null;
        const href = p.action === "join_tier" ? (creatorHref ? `${creatorHref}#tiers` : undefined) : action?.href;
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
