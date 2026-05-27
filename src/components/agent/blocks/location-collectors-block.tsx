"use client";

import { cn, fmt } from "~/lib/utils";
import { SectionHeader } from "~/components/agent/shared/section-header";
import { MetricCard } from "~/components/agent/shared/metric-card";
import { PaginationFooter } from "~/components/agent/shared/pagination-footer";
import type { LocationCollectorsResponse } from "~/types/agent/types";

interface Props {
    data: LocationCollectorsResponse["data"];
    onLoadMore?: (nextOffset: number) => void;
    isLoadingMore?: boolean;
    isSlate?: boolean;
}

export function LocationCollectorsBlock({ data, onLoadMore, isLoadingMore, isSlate }: Props) {
    const { pinTitle, totalClaimed, totalRedeemed, collectors, pagination } = data;

    const redeemRate = totalClaimed > 0
        ? Math.round(totalRedeemed / totalClaimed * 100)
        : 0;

    return (
        <div className="flex flex-col gap-3">

            {/* Header */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <span className="text-base">📍</span>
                    <p className="text-[13px] font-bold text-foreground">Location Collectors</p>
                </div>
                <p className="text-[11px] text-muted-foreground">{pinTitle}</p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2">
                <MetricCard label="Total Claimed" value={totalClaimed} />
                <MetricCard label="Total Redeemed" value={totalRedeemed} highlight />
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

            {/* Collector list */}
            <SectionHeader label="Collectors" icon="👥" count={pagination.total} />

            {collectors.length === 0 ? (
                <p className="text-[12px] text-muted-foreground italic">No collectors yet.</p>
            ) : (
                <div className="flex flex-col gap-1.5">
                    {collectors.map((c, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-muted/30"
                        >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary flex-shrink-0 overflow-hidden">
                                {c.image
                                    // eslint-disable-next-line @next/next/no-img-element
                                    ? <img src={c.image} className="w-8 h-8 object-cover" alt={c.name} />
                                    : c.name.charAt(0).toUpperCase()
                                }
                            </div>
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-foreground truncate">{c.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {c.claimedAt && (
                                        <span className="text-[10px] text-muted-foreground">
                                            Claimed {fmt(c.claimedAt)}
                                        </span>
                                    )}
                                    {c.viewedAt && !c.claimedAt && (
                                        <span className="text-[10px] text-muted-foreground">
                                            Viewed {fmt(c.viewedAt)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded border font-semibold",
                                    c.isRedeemed
                                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                                        : "bg-muted text-muted-foreground border-border",
                                )}>
                                    {c.isRedeemed ? "Redeemed" : "Claimed"}
                                </span>
                                {c.redeemedAt && (
                                    <span className="text-[10px] text-muted-foreground">
                                        {fmt(c.redeemedAt)}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <PaginationFooter
                pagination={pagination}
                onLoadMore={onLoadMore ?? (() => undefined)}
                isLoading={isLoadingMore ?? false}
                entityLabel="collectors"
                isSlate={isSlate}
            />
        </div>
    );
}