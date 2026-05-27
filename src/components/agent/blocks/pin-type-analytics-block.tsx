"use client";

import { cn } from "~/lib/utils";
import type { PinTypeAnalyticsResponse } from "~/types/agent/types";

interface Props {
    data: PinTypeAnalyticsResponse["data"];
}

const TYPE_COLORS: Record<string, string> = {
    EVENT: "bg-amber-500",
    LANDMARK: "bg-primary",
    BOUNTY: "bg-purple-500",
    EXPERIENCE: "bg-cyan-500",
    LAUNCH: "bg-emerald-500",
    OTHER: "bg-muted-foreground",
};

export function PinTypeAnalyticsBlock({ data }: Props) {
    const { byType, bestType, insight } = data;

    const maxRate = Math.max(
        ...byType.map(t => parseFloat(t.avgClaimRate) || 0),
        1,
    );

    return (
        <div className="flex flex-col gap-4">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2">
                <span className="text-base">📌</span>
                <p className="text-[13px] font-bold text-foreground">Pin Type Analytics</p>
            </div>

            {/* ── Best type callout ──────────────────────────────────────────── */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <span className="text-base">🥇</span>
                <p className="text-[12px] text-primary font-semibold">
                    Best performing type: <span className="font-black">{bestType}</span>
                </p>
            </div>

            {/* ── Per-type breakdown ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
                {byType.map((t) => {
                    const rate = parseFloat(t.avgClaimRate) || 0;
                    const pct = (rate / maxRate) * 100;
                    const isBest = t.type === bestType;
                    const barColor = TYPE_COLORS[t.type] ?? "bg-muted-foreground";

                    return (
                        <div
                            key={t.type}
                            className={cn(
                                "flex flex-col gap-1.5 px-3 py-2.5 rounded-xl border",
                                isBest ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30",
                            )}
                        >
                            {/* Type row */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", barColor)} />
                                    <span className="text-[12px] font-bold text-foreground">{t.type}</span>
                                    <span className="text-[10px] text-muted-foreground">{t.count} pin{t.count !== 1 ? "s" : ""}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        "text-[12px] font-bold",
                                        isBest ? "text-primary" : "text-foreground",
                                    )}>
                                        {t.avgClaimRate}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                        {t.avgRedeemRate} redeemed
                                    </span>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all", barColor)}
                                    style={{ width: `${pct}%`, opacity: isBest ? 1 : 0.5 }}
                                />
                            </div>

                            {/* Totals */}
                            <p className="text-[10px] text-muted-foreground">
                                {t.totalClaimed.toLocaleString()} total claimed
                            </p>
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