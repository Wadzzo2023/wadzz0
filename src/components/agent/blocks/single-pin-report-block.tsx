"use client";

import { cn, fmt } from "~/lib/utils";
import { SectionHeader } from "~/components/agent/shared/section-header";
import { MetricCard } from "~/components/agent/shared/metric-card";
import { Stat } from "~/components/agent/shared/stat";
import { StatusBadge } from "~/components/agent/shared/status-badge";
import type { SinglePinReportResponse } from "~/types/agent/types";

interface Props {
    data: SinglePinReportResponse["data"];
    // called when user clicks "View all collectors" on a location
    onViewLocationCollectors?: (locationId: string) => void;
}

export function SinglePinReportBlock({ data, onViewLocationCollectors }: Props) {
    const { pin, stats, locations, topCollectors, totalCollectors, insights } = data;

    return (
        <div className="flex flex-col gap-4">

            {/* ── Pin header ─────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">{pin.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                        {fmt(pin.startDate)} → {fmt(pin.endDate)}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={pin.status} />
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/40 text-muted-foreground font-semibold">
                            {pin.type}
                        </span>
                        {pin.radius && (
                            <span className="text-[10px] text-muted-foreground">{pin.radius}m radius</span>
                        )}
                        {pin.isHotspotPin && (
                            <span className="text-[10px] text-blue-400">🔁 hotspot-linked</span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Stats grid ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-2">
                <MetricCard label="Claimed" value={`${stats.claimed} / ${stats.limit}`} />
                <MetricCard label="Remaining" value={stats.remaining} />
                <MetricCard label="Claim Rate" value={stats.claimRate} highlight />
                <MetricCard label="Redeem Rate" value={stats.redeemRate} highlight />
            </div>

            {/* ── View funnel ────────────────────────────────────────────────── */}
            {stats.totalViewed != null && stats.totalViewed > 0 && (
                <div className="flex flex-col gap-2 px-3 py-3 rounded-xl border border-border bg-muted/30">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        View Funnel
                    </p>
                    <div className="flex items-center gap-2">
                        {[
                            { label: "Viewed", value: stats.totalViewed, color: "bg-blue-400" },
                            { label: "Claimed", value: stats.claimed, color: "bg-primary" },
                            { label: "Redeemed", value: stats.redeemed, color: "bg-emerald-500" },
                        ].map((step, i, arr) => (
                            <div key={step.label} className="flex items-center gap-2 flex-1">
                                <div className="flex flex-col items-center gap-1 flex-1">
                                    <span className="text-[11px] font-bold text-foreground tabular-nums">
                                        {step.value}
                                    </span>
                                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full", step.color)}
                                            style={{ width: `${stats.totalViewed ? Math.round(step.value / stats.totalViewed * 100) : 0}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">{step.label}</span>
                                </div>
                                {i < arr.length - 1 && (
                                    <span className="text-muted-foreground text-[10px] flex-shrink-0">→</span>
                                )}
                            </div>
                        ))}
                    </div>
                    {stats.viewToClaimRate && (
                        <p className="text-[10px] text-muted-foreground text-center">
                            View → Claim conversion: <span className="font-bold text-primary">{stats.viewToClaimRate}</span>
                        </p>
                    )}
                </div>
            )}

            {/* ── Locations breakdown (Level 2) ──────────────────────────────── */}
            {locations.length > 0 && (
                <div className="flex flex-col gap-2">
                    <SectionHeader label="Locations" icon="📍" count={locations.length} />
                    <div className="flex flex-col gap-1.5">
                        {locations.map((loc, i) => (
                            <div
                                key={loc.id}
                                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-border bg-muted/30"
                            >
                                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                    <p className="text-[12px] font-semibold text-foreground">
                                        Location {i + 1}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-mono">
                                        {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                                    </p>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <Stat label="Claimed" value={loc.totalClaimed} />
                                        <Stat label="Redeemed" value={loc.totalRedeemed} />
                                        {loc.totalViewed > 0 && (
                                            <Stat label="Viewed" value={loc.totalViewed} />
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                    <span className="text-[12px] font-bold text-primary">{loc.claimRate}</span>
                                    {onViewLocationCollectors && loc.totalClaimed > 0 && (
                                        <button
                                            onClick={() => onViewLocationCollectors(loc.id)}
                                            className="text-[10px] text-primary/70 hover:text-primary underline transition-colors"
                                        >
                                            View collectors →
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Top collectors (inline, max 5) ─────────────────────────────── */}
            {topCollectors.length > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <SectionHeader label="Top Collectors" icon="👥" />
                        {totalCollectors > topCollectors.length && (
                            <span className="text-[10px] text-muted-foreground">
                                +{totalCollectors - topCollectors.length} more
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {topCollectors.map((c, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl border border-border bg-muted/30"
                            >
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary flex-shrink-0 overflow-hidden">
                                    {c.image
                                        // eslint-disable-next-line @next/next/no-img-element
                                        ? <img src={c.image} className="w-7 h-7 object-cover" alt={c.name} />
                                        : c.name.charAt(0).toUpperCase()
                                    }
                                </div>
                                <div className="flex flex-col gap-0 flex-1 min-w-0">
                                    <p className="text-[12px] font-semibold text-foreground truncate">{c.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{fmt(c.claimedAt)}</p>
                                </div>
                                <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded border font-semibold flex-shrink-0",
                                    c.isRedeemed
                                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                                        : "bg-muted text-muted-foreground border-border",
                                )}>
                                    {c.isRedeemed ? "Redeemed" : "Claimed"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── LLM insight ────────────────────────────────────────────────── */}
            {insights && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
                    <span className="text-base flex-shrink-0">💡</span>
                    <p className="text-[12px] text-primary leading-relaxed">{insights}</p>
                </div>
            )}
        </div>
    );
}