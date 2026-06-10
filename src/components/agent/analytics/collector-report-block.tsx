"use client";

import { cn } from "~/lib/utils";
import { SectionHeader } from "~/components/agent/shared/section-header";
import { MetricCard } from "~/components/agent/shared/metric-card";
import { PaginationFooter } from "~/components/agent/shared/pagination-footer";
import { fmt } from "~/lib/utils";
import type { CollectorReportData } from "~/types/agent/types";

// ─── CollectorReportBlock ─────────────────────────────────────────────────────

export function CollectorReportBlock({
    data,
    onLoadMore,
    isLoadingMore,
    isSlate = false,
}: {
    data: CollectorReportData;
    onLoadMore?: (nextOffset: number) => void;
    isLoadingMore?: boolean;
    isSlate?: boolean;
}) {

    // ── Single collector ───────────────────────────────────────────────────────
    if (data.mode === "single_collector" && data.collector) {
        const { collector, collections = [] } = data;
        const redeemRate =
            collector.totalCollected > 0
                ? Math.round((collector.totalRedeemed / collector.totalCollected) * 100)
                : 0;

        return (
            <div className="flex flex-col gap-3">

                {/* Profile card */}
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl border border-border bg-muted/30">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0 overflow-hidden">
                        {collector.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={collector.image}
                                className="w-10 h-10 object-cover"
                                alt={collector.name}
                            />
                        ) : (
                            collector.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-foreground truncate">
                            {collector.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                            {collector.email}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                        <span className="text-[11px] font-bold text-primary">
                            {collector.totalCollected} pins
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            {redeemRate}% redeemed
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                    <MetricCard label="Total Collected" value={collector.totalCollected} />
                    <MetricCard label="Total Redeemed" value={collector.totalRedeemed} highlight />
                </div>

                {/* Redeem rate bar */}
                <div className="flex flex-col gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">Redeem Rate</span>
                        <span className="text-[11px] font-bold text-primary">{redeemRate}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${redeemRate}%` }}
                        />
                    </div>
                </div>

                {/* Collections list */}
                {collections.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                        <SectionHeader label="Pins Collected" icon="📍" count={collections.length} />
                        <div className="flex flex-col gap-1.5">
                            {collections.map((c, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-muted/30"
                                >
                                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                        <p className="text-[12px] font-semibold text-foreground truncate">
                                            {c.pinTitle}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {fmt(c.pinStartDate)} → {fmt(c.pinEndDate)}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            Claimed {fmt(c.claimedAt)}
                                        </p>
                                    </div>
                                    <span
                                        className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded border font-semibold flex-shrink-0",
                                            c.isRedeemed
                                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                                                : "bg-muted text-muted-foreground border-border",
                                        )}
                                    >
                                        {c.isRedeemed ? "Redeemed" : "Claimed"}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <PaginationFooter
                            pagination={data.pagination ?? null}
                            onLoadMore={onLoadMore ?? (() => undefined)}
                            isLoading={isLoadingMore ?? false}
                            entityLabel="collections"
                            isSlate={isSlate}
                        />
                    </div>
                )}
            </div>
        );
    }

    // ── All collectors ─────────────────────────────────────────────────────────
    const collectors = data.collectors ?? [];

    return (
        <div className="flex flex-col gap-3">
            <SectionHeader
                label="All Collectors"
                icon="👥"
                count={data.pagination?.total}
            />

            {collectors.length === 0 ? (
                <p className="text-[13px] text-muted-foreground italic px-1">
                    No collectors yet.
                </p>
            ) : (
                <div className="flex flex-col gap-1.5">
                    {collectors.map((c, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-muted/30"
                        >
                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 overflow-hidden">
                                {c.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={c.image}
                                        className="w-8 h-8 object-cover"
                                        alt={c.name}
                                    />
                                ) : (
                                    c.name.charAt(0).toUpperCase()
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-foreground truncate">
                                    {c.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                    {c.email}
                                </p>
                                {c.lastClaimedAt && (
                                    <p className="text-[10px] text-muted-foreground">
                                        Last active {fmt(c.lastClaimedAt)}
                                    </p>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                <span className="text-[11px] font-bold text-foreground tabular-nums">
                                    {c.collected} collected
                                </span>
                                <span
                                    className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded border font-semibold",
                                        c.redeemed > 0
                                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                                            : "bg-muted text-muted-foreground border-border",
                                    )}
                                >
                                    {c.redeemed} redeemed
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <PaginationFooter
                pagination={data.pagination ?? null}
                onLoadMore={onLoadMore ?? (() => undefined)}
                isLoading={isLoadingMore ?? false}
                entityLabel="collectors"
                isSlate={isSlate}
            />
        </div>
    );
}