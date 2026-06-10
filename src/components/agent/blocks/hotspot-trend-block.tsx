"use client";

import { cn, fmt } from "~/lib/utils";
import type { HotspotTrendResponse } from "~/types/agent/types";

interface Props {
    data: HotspotTrendResponse["data"];
}

const TREND_CONFIG = {
    improving: { label: "Improving ↑", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/25" },
    declining: { label: "Declining ↓", color: "text-red-400", bg: "bg-red-500/10 border-red-500/25" },
    stable: { label: "Stable →", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/25" },
    peaked: { label: "Peaked 📈", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/25" },
};

export function HotspotTrendBlock({ data }: Props) {
    const { drops, trend, peakDrop, avgClaimRate, insight } = data;
    const trendCfg = TREND_CONFIG[trend];

    // Compute bar heights relative to max
    const rates = drops.map(d => parseFloat(d.claimRate));
    const maxRate = Math.max(...rates, 1);

    return (
        <div className="flex flex-col gap-4">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">{data.hotspotName}</p>
                    <p className="text-[11px] text-muted-foreground">
                        {data.totalDrops} drops · avg {avgClaimRate}
                    </p>
                </div>
                <span className={cn(
                    "text-[11px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0",
                    trendCfg.color, trendCfg.bg,
                )}>
                    {trendCfg.label}
                </span>
            </div>

            {/* ── Bar chart ──────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-2 px-3 py-3 rounded-xl border border-border bg-muted/30">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Claim Rate per Drop
                </p>

                {/* Bars */}
                <div className="flex items-end gap-1.5 h-20">
                    {drops.map((drop, i) => {
                        const rate = rates[i] ?? 0;
                        const pct = maxRate > 0 ? (rate / maxRate) * 100 : 0;
                        const isPeak = drop.dropNumber === peakDrop;
                        return (
                            <div key={drop.dropNumber} className="flex flex-col items-center gap-1 flex-1">
                                <span className="text-[9px] font-bold text-foreground tabular-nums">
                                    {drop.claimRate}
                                </span>
                                <div className="w-full relative" style={{ height: "52px" }}>
                                    <div
                                        className={cn(
                                            "absolute bottom-0 left-0 right-0 rounded-t-md transition-all",
                                            isPeak ? "bg-amber-400" : "bg-primary/60",
                                        )}
                                        style={{ height: `${pct}%` }}
                                    />
                                </div>
                                <span className="text-[9px] text-muted-foreground">
                                    #{drop.dropNumber}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                        <span className="text-[10px] text-muted-foreground">Peak (drop #{peakDrop})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-primary/60" />
                        <span className="text-[10px] text-muted-foreground">Other drops</span>
                    </div>
                </div>
            </div>

            {/* ── Drop detail rows ───────────────────────────────────────────── */}
            <div className="flex flex-col gap-1.5">
                {drops.map((drop, i) => {
                    const isPeak = drop.dropNumber === peakDrop;
                    const prevRate = i > 0 ? (rates[i - 1] ?? 0) : null;
                    const currRate = rates[i] ?? 0;
                    const arrow = prevRate === null ? "" : currRate > prevRate ? " ↑" : currRate < prevRate ? " ↓" : " →";
                    return (
                        <div
                            key={drop.dropNumber}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl border",
                                isPeak
                                    ? "border-amber-500/30 bg-amber-500/5"
                                    : "border-border bg-muted/30",
                            )}
                        >
                            <span className={cn(
                                "text-[11px] font-black w-7 flex-shrink-0",
                                isPeak ? "text-amber-400" : "text-muted-foreground",
                            )}>
                                #{drop.dropNumber}
                            </span>
                            <div className="flex flex-col gap-0 flex-1 min-w-0">
                                <p className="text-[11px] text-muted-foreground">
                                    {fmt(drop.startDate)} → {fmt(drop.endDate)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    {drop.claimed}/{drop.limit} claimed · {drop.redeemed} redeemed
                                </p>
                            </div>
                            <span className={cn(
                                "text-[12px] font-bold flex-shrink-0",
                                isPeak ? "text-amber-400" : "text-foreground",
                            )}>
                                {drop.claimRate}
                                <span className={cn(
                                    "text-[10px] ml-0.5",
                                    arrow === " ↑" ? "text-emerald-400" : arrow === " ↓" ? "text-red-400" : "text-muted-foreground",
                                )}>
                                    {arrow}
                                </span>
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* ── Insight ────────────────────────────────────────────────────── */}
            {insight && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
                    <span className="text-base flex-shrink-0">💡</span>
                    <p className="text-[12px] text-primary leading-relaxed">{insight}</p>
                </div>
            )}
        </div>
    );
}