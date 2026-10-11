import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Button } from "~/components/shadcn/ui/button";
import { cn } from "~/lib/utils";
import { formatAmount, type CostLine, type Problem } from "~/lib/stellar/quote";

/** Every line of what an action costs, the total, and the payer's balance. */
export function CostBreakdown({
  lines,
  total,
  currency,
  balance,
  className,
}: {
  lines: CostLine[];
  total: number;
  currency: string;
  balance?: number | null;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-surface-2/60 p-4", className)}>
      <p className="label-caps mb-3">Cost breakdown</p>
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
        <div className="flex items-center justify-between gap-3 border-t pt-2.5">
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
