"use client";

import { SectionHeader } from "~/components/agent/shared/section-header";
import { MetricCard } from "~/components/agent/shared/metric-card";
import { Stat } from "~/components/agent/shared/stat";
import type { AnalyticsData } from "~/types/agent/types";

// ─── AnalyticsBlock ───────────────────────────────────────────────────────────

export function AnalyticsBlock({ data }: { data: AnalyticsData }) {
    const pins = (data.perPin ?? []).map((p) => ({
        ...p,
        title: p.title ?? "Unnamed",
    }));

    return (
        <div className="flex flex-col gap-3">

            {/* ── Aggregate metrics ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-2">
                <MetricCard label="Total Claimed" value={data.totalClaimed} />
                <MetricCard label="Total Redeemed" value={data.totalRedeemed} />
                <MetricCard label="Claim Rate" value={data.claimRate} highlight />
                {data.redeemRate && (
                    <MetricCard label="Redeem Rate" value={data.redeemRate} highlight />
                )}
            </div>

            {/* ── Per-pin breakdown ─────────────────────────────────────────────── */}
            {pins.length > 0 && (
                <section className="flex flex-col gap-1.5">
                    <SectionHeader label="Per Pin" icon="📊" />
                    <div className="flex flex-col gap-1.5">
                        {pins.map((p, i) => (
                            <div
                                key={p.id ?? i}
                                className="px-3 py-2.5 rounded-xl border border-border bg-muted/30 flex flex-col gap-1.5"
                            >
                                <p className="text-[12px] font-semibold text-foreground truncate">
                                    {p.title}
                                </p>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <Stat label="Claimed" value={p.claimed} />
                                    <Stat label="Redeemed" value={p.redeemed} />
                                    <Stat label="Remaining" value={p.remaining} dim={p.remaining === 0} />
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-muted-foreground">Rate:</span>
                                        <span className="text-[11px] font-bold text-primary">{p.claimRate}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Insights ──────────────────────────────────────────────────────── */}
            {data.insights && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
                    <span className="text-base flex-shrink-0">💡</span>
                    <p className="text-[12px] text-primary leading-relaxed">{data.insights}</p>
                </div>
            )}
        </div>
    );
}