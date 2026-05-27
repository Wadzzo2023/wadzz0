"use client";

import { cn } from "~/lib/utils";
import { MetricCard } from "~/components/agent/shared/metric-card";
import type { TimeAnalyticsResponse } from "~/types/agent/types";

interface Props {
    data: TimeAnalyticsResponse["data"];
}

export function TimeAnalyticsBlock({ data }: Props) {
    const {
        bestDayOfWeek, bestHour,
        claimsByDayOfWeek, claimsByHour,
        avgRedemptionLagHours, viewToClaimRate, insight,
    } = data;

    const maxDow = Math.max(...claimsByDayOfWeek.map(d => d.claims), 1);
    const maxHour = Math.max(...claimsByHour.map(h => h.claims), 1);

    const fmtHour = (h: number) => {
        const period = h < 12 ? "am" : "pm";
        const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${display}${period}`;
    };

    return (
        <div className="flex flex-col gap-4">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2">
                <span className="text-base">⏰</span>
                <p className="text-[13px] font-bold text-foreground">Time Analytics</p>
            </div>

            {/* ── Quick metrics ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-2">
                <MetricCard label="Best Day" value={bestDayOfWeek} highlight />
                <MetricCard label="Best Hour" value={fmtHour(bestHour)} highlight />
                {avgRedemptionLagHours != null && (
                    <MetricCard
                        label="Avg Redeem Lag"
                        value={`${avgRedemptionLagHours.toFixed(1)}h`}
                    />
                )}
                {viewToClaimRate && (
                    <MetricCard label="View → Claim" value={viewToClaimRate} />
                )}
            </div>

            {/* ── Claims by day of week ──────────────────────────────────────── */}
            {claimsByDayOfWeek.length > 0 && (
                <div className="flex flex-col gap-2 px-3 py-3 rounded-xl border border-border bg-muted/30">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Claims by Day of Week
                    </p>
                    <div className="flex items-end gap-1 h-16 mt-1">
                        {claimsByDayOfWeek.map((d) => {
                            const pct = (d.claims / maxDow) * 100;
                            const isBest = d.day === bestDayOfWeek;
                            return (
                                <div key={d.day} className="flex flex-col items-center gap-1 flex-1">
                                    <div className="w-full relative" style={{ height: "44px" }}>
                                        <div
                                            className={cn(
                                                "absolute bottom-0 left-0 right-0 rounded-t-sm",
                                                isBest ? "bg-primary" : "bg-primary/30",
                                            )}
                                            style={{ height: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] text-muted-foreground">
                                        {d.day.slice(0, 2)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Claims by hour ─────────────────────────────────────────────── */}
            {claimsByHour.length > 0 && (
                <div className="flex flex-col gap-2 px-3 py-3 rounded-xl border border-border bg-muted/30">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Claims by Hour of Day
                    </p>
                    <div className="flex items-end gap-px h-12 mt-1">
                        {claimsByHour.map((h) => {
                            const pct = (h.claims / maxHour) * 100;
                            const isBest = h.hour === bestHour;
                            return (
                                <div
                                    key={h.hour}
                                    className="flex flex-col items-center flex-1"
                                    title={`${fmtHour(h.hour)}: ${h.claims} claims`}
                                >
                                    <div className="w-full relative" style={{ height: "36px" }}>
                                        <div
                                            className={cn(
                                                "absolute bottom-0 left-0 right-0",
                                                isBest ? "bg-primary" : "bg-primary/25",
                                            )}
                                            style={{ height: `${pct}%`, minHeight: pct > 0 ? "2px" : "0" }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* x-axis labels — only show a few */}
                    <div className="flex items-center justify-between px-0">
                        {[0, 6, 12, 18, 23].map(h => (
                            <span key={h} className="text-[9px] text-muted-foreground">{fmtHour(h)}</span>
                        ))}
                    </div>
                </div>
            )}

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