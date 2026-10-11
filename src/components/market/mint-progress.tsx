/** How much of the edition has been minted, as a glowing progress bar (open editions show the count). */
export function MintProgress({ minted, limit }: { minted: number; limit: number | null }) {
  const pct = limit ? Math.min(100, Math.round((minted / limit) * 100)) : null;
  return (
    <div className="glass space-y-2 rounded-xl p-3.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{limit ? "Minted" : "Open edition"}</span>
        <span className="font-hud font-bold tabular-nums">
          {minted.toLocaleString("en-US")}
          {limit != null && <span className="text-muted-foreground"> / {limit.toLocaleString("en-US")}</span>}
          {pct != null && <span className="ml-2 text-xs font-semibold text-primary">{pct}%</span>}
        </span>
      </div>
      {pct != null && (
        <div className="h-2 overflow-hidden rounded-full bg-foreground/[0.08]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Minted">
          <div className="h-full rounded-full bg-gradient-to-r from-primary via-green-hot to-cyan-400 shadow-[0_0_12px_hsl(var(--primary)/0.7)]" style={{ width: `${Math.max(pct, 2)}%` }} />
        </div>
      )}
    </div>
  );
}
