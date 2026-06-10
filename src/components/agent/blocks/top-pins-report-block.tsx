"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn, fmt } from "~/lib/utils";
import { MetricCard } from "~/components/agent/shared/metric-card";
import { Stat } from "~/components/agent/shared/stat";
import { StatusBadge } from "~/components/agent/shared/status-badge";
import type { TopPinsReportResponse } from "~/types/agent/types";

interface Props {
    data: TopPinsReportResponse["data"];
}

// Rank medal colours
const MEDAL: Record<number, string> = {
    1: "text-amber-400",
    2: "text-slate-400",
    3: "text-amber-700",
};

export function TopPinsReportBlock({ data }: Props) {
    const [expanded, setExpanded] = useState<Set<number>>(new Set([0])); // first expanded by default

    const toggle = (idx: number) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx); else next.add(idx);
            return next;
        });
    };

    return (
        <div className="flex flex-col gap-3">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-base">🏆</span>
                    <p className="text-[13px] font-bold text-foreground">
                        Top {data.ranked.length} Pins
                    </p>
                </div>
                <span className="text-[11px] text-muted-foreground">
                    sorted by {data.sortedBy}
                </span>
            </div>

            {/* Ranked list */}
            {data.ranked.map((item, idx) => {
                const isExpanded = expanded.has(idx);
                const medalColor = MEDAL[item.rank] ?? "text-muted-foreground";

                return (
                    <div
                        key={item.pin.id}
                        className="rounded-xl border border-border bg-muted/20 overflow-hidden"
                    >
                        {/* ── Collapsed row ──────────────────────────────────── */}
                        <button
                            onClick={() => toggle(idx)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
                        >
                            <span className={cn("text-[13px] font-black w-6 flex-shrink-0 tabular-nums", medalColor)}>
                                #{item.rank}
                            </span>

                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-foreground truncate">
                                    {item.pin.title}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <StatusBadge status={item.pin.status} />
                                    <span className="text-[10px] text-muted-foreground">
                                        {fmt(item.pin.startDate)} → {fmt(item.pin.endDate)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[13px] font-bold text-primary">{item.stats.claimRate}</span>
                                {isExpanded
                                    ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                }
                            </div>
                        </button>

                        {/* ── Expanded detail ────────────────────────────────── */}
                        {isExpanded && (
                            <div className="border-t border-border px-3 py-3 flex flex-col gap-3 bg-background">

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-2">
                                    <MetricCard label="Claimed" value={`${item.stats.claimed} / ${item.stats.limit}`} />
                                    <MetricCard label="Remaining" value={item.stats.remaining} />
                                    <MetricCard label="Claim Rate" value={item.stats.claimRate} highlight />
                                    <MetricCard label="Redeem Rate" value={item.stats.redeemRate} highlight />
                                </div>

                                {/* Locations (Level 2) */}
                                {item.locations.length > 0 && (
                                    <div className="flex flex-col gap-1.5">
                                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            📍 Locations
                                        </p>
                                        {item.locations.map((loc, i) => (
                                            <div
                                                key={loc.id}
                                                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30"
                                            >
                                                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                                    <p className="text-[11px] font-semibold text-foreground">
                                                        Location {i + 1}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground font-mono">
                                                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Stat label="Claimed" value={loc.totalClaimed} />
                                                    <Stat label="Redeemed" value={loc.totalRedeemed} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Top collectors */}
                                {item.topCollectors.length > 0 && (
                                    <div className="flex flex-col gap-1.5">
                                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            👥 Top Collectors
                                        </p>
                                        {item.topCollectors.map((c, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border bg-muted/30"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0 overflow-hidden">
                                                    {c.image
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        ? <img src={c.image} className="w-6 h-6 object-cover" alt={c.name} />
                                                        : c.name.charAt(0).toUpperCase()
                                                    }
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <p className="text-[11px] font-semibold text-foreground truncate">{c.name}</p>
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
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            <p className="text-[10px] text-muted-foreground text-center italic">
                Generated at {fmt(data.generatedAt)}
            </p>
        </div>
    );
}