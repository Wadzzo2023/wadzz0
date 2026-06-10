"use client";

import { useState } from "react";
import { cn } from "~/lib/utils";
import { SectionHeader } from "~/components/agent/shared/section-header";
import { MetricCard } from "~/components/agent/shared/metric-card";
import { PaginationFooter } from "~/components/agent/shared/pagination-footer";
import { fmtDateTime } from "~/lib/utils";
import type { ReportData } from "~/types/agent/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortCol = "claimRate" | "claimed" | "redeemed" | "remaining";

// ─── ReportBlock ──────────────────────────────────────────────────────────────

export function ReportBlock({
    data,
    onLoadMore,
    isLoadingMore,
    isSlate = false,
}: {
    data: ReportData;
    onLoadMore?: (nextOffset: number) => void;
    isLoadingMore?: boolean;
    isSlate?: boolean;  // whether this block is rendered in a "slate" style (used for all but the last block in a message)
}) {
    const [sortCol, setSortCol] = useState<SortCol>("claimRate");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    console.log("ReportBlock data:", data);
    // ── Sorting ──────────────────────────────────────────────────────────────
    const sorted = [...(data.perPin ?? [])].sort((a, b) => {
        const parse = (v: string | number) =>
            typeof v === "string" ? parseFloat(v) : v;
        const av = parse(sortCol === "claimRate" ? a.claimRate : a[sortCol]);
        const bv = parse(sortCol === "claimRate" ? b.claimRate : b[sortCol]);
        return sortDir === "desc" ? bv - av : av - bv;
    });

    const toggleSort = (col: SortCol) => {
        if (sortCol === col) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
        else { setSortCol(col); setSortDir("desc"); }
    };

    const SortIcon = ({ col }: { col: SortCol }) => (
        <span
            className={cn(
                "text-[10px] ml-0.5",
                sortCol === col ? "text-primary" : "text-muted-foreground/40",
            )}
        >
            {sortCol === col ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
        </span>
    );

    // ── Status breakdown bar ──────────────────────────────────────────────────
    const { summary } = data;
    const statusBreakdown = [
        { label: "Active", count: summary.activePins, color: "bg-emerald-500" },
        { label: "Expired", count: summary.expiredPins, color: "bg-muted-foreground" },
        { label: "Fully Claimed", count: summary.fullyClaimedPins, color: "bg-amber-500" },
        {
            label: "Other",
            count:
                summary.totalPins -
                summary.activePins -
                summary.expiredPins -
                summary.fullyClaimedPins,
            color: "bg-red-400",
        },
    ].filter((s) => s.count > 0);

    return (
        <div className="flex flex-col gap-4">

            {/* ── Header ─────────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-base">📊</span>
                    <p className="text-[13px] font-bold text-foreground">Pin Report</p>
                </div>
                <p className="text-[10px] text-muted-foreground">
                    {fmtDateTime(data.generatedAt)}
                </p>
            </div>

            {/* ── Summary cards ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-2">
                <MetricCard label="Total Claimed" value={summary.totalClaimed} />
                <MetricCard label="Total Redeemed" value={summary.totalRedeemed} />
                <MetricCard label="Claim Rate" value={summary.claimRate} highlight />
                <MetricCard label="Redeem Rate" value={summary.redeemRate} highlight />
            </div>

            {/* ── Status breakdown ───────────────────────────────────────────────── */}
            <div className="flex flex-col gap-2 px-3 py-3 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Pin Breakdown
                    </p>
                    <p className="text-[11px] font-semibold text-foreground">
                        {summary.totalPins} total
                    </p>
                </div>

                {/* Bar */}
                <div className="flex h-2 rounded-full overflow-hidden gap-px">
                    {statusBreakdown.map((s) => (
                        <div
                            key={s.label}
                            className={cn("h-full transition-all", s.color)}
                            style={{ width: `${(s.count / summary.totalPins) * 100}%` }}
                        />
                    ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    {statusBreakdown.map((s) => (
                        <div key={s.label} className="flex items-center gap-1.5">
                            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", s.color)} />
                            <span className="text-[10px] text-muted-foreground">
                                {s.label}{" "}
                                <span className="font-semibold text-foreground">{s.count}</span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Top performers ─────────────────────────────────────────────────── */}
            {(data.topPerformers?.length ?? 0) > 0 && (
                <div className="flex flex-col gap-2">
                    <SectionHeader label="Top Performers" icon="🏆" />
                    <div className="flex flex-col gap-1.5">
                        {data.topPerformers.map((p, i) => {
                            const pct = parseFloat(p.claimRate);
                            return (
                                <div
                                    key={p.id}
                                    className="flex flex-col gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-muted/30"
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                "text-[11px] font-black w-5 flex-shrink-0 tabular-nums",
                                                i === 0
                                                    ? "text-amber-400"
                                                    : i === 1
                                                        ? "text-slate-400"
                                                        : i === 2
                                                            ? "text-amber-700"
                                                            : "text-muted-foreground",
                                            )}
                                        >
                                            #{i + 1}
                                        </span>
                                        <p className="text-[12px] font-semibold text-foreground truncate flex-1">
                                            {p.title}
                                        </p>
                                        <span className="text-[11px] font-bold text-primary flex-shrink-0">
                                            {p.claimRate}
                                        </span>
                                    </div>
                                    <div className="ml-7 flex flex-col gap-1">
                                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all"
                                                style={{ width: `${Math.min(pct, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-muted-foreground">
                                                {p.claimed}/{p.limit} claimed
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {p.remaining} remaining
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Sortable per-pin table ─────────────────────────────────────────── */}
            {sorted.length > 0 && (
                <div className="flex flex-col gap-2">
                    <SectionHeader label="All Pins" icon="📋" />
                    <div className="rounded-xl border border-border overflow-hidden">
                        {/* Header row */}
                        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 bg-muted/60 border-b border-border px-3 py-2">
                            {(
                                [
                                    { label: "Pin", col: null },
                                    { label: "Claimed", col: "claimed" as SortCol },
                                    { label: "Redeemed", col: "redeemed" as SortCol },
                                    { label: "Left", col: "remaining" as SortCol },
                                    { label: "Rate", col: "claimRate" as SortCol },
                                ] as const
                            ).map(({ label, col }) => (
                                <button
                                    key={label}
                                    onClick={() => col && toggleSort(col)}
                                    disabled={!col}
                                    className={cn(
                                        "text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-left",
                                        col && "hover:text-foreground transition-colors cursor-pointer",
                                        !col && "cursor-default",
                                    )}
                                >
                                    {label}
                                    {col && <SortIcon col={col} />}
                                </button>
                            ))}
                        </div>

                        {/* Data rows */}
                        <div className="divide-y divide-border">
                            {sorted.map((p, i) => (
                                <div
                                    key={p.id}
                                    className={cn(
                                        "grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 px-3 py-2.5 items-center",
                                        i % 2 === 0 ? "bg-background" : "bg-muted/20",
                                    )}
                                >
                                    <p className="text-[11px] font-semibold text-foreground truncate pr-2">
                                        {p.title}
                                    </p>
                                    <span className="text-[11px] tabular-nums text-foreground w-14 text-right">
                                        {p.claimed}
                                    </span>
                                    <span className="text-[11px] tabular-nums text-foreground w-16 text-right">
                                        {p.redeemed}
                                    </span>
                                    <span
                                        className={cn(
                                            "text-[11px] tabular-nums w-10 text-right",
                                            p.remaining === 0 ? "text-amber-400" : "text-foreground",
                                        )}
                                    >
                                        {p.remaining}
                                    </span>
                                    <span className="text-[11px] tabular-nums font-bold text-primary w-12 text-right">
                                        {p.claimRate}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Load more */}
                    <PaginationFooter
                        pagination={data.pagination ?? null}
                        onLoadMore={onLoadMore ?? (() => undefined)}
                        isLoading={isLoadingMore ?? false}
                        entityLabel="pins"
                        isSlate={isSlate}
                    />
                </div>
            )}
        </div>
    );
}