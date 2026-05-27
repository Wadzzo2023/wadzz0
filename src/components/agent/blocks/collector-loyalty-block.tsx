"use client";

import { useState } from "react";
import { cn, fmt } from "~/lib/utils";
import { PaginationFooter } from "~/components/agent/shared/pagination-footer";
import type { CollectorLoyaltyResponse, CollectorLoyalty } from "~/types/agent/types";

interface Props {
    data: CollectorLoyaltyResponse["data"];
    onLoadMore?: (nextOffset: number) => void;
    isLoadingMore?: boolean;
    isSlate?: boolean;
}

type Segment = "champions" | "collectorsOnly" | "atRisk" | "newThisWeek";

const SEGMENT_CONFIG: Record<Segment, {
    label: string; icon: string;
    color: string; bg: string; border: string;
}> = {
    champions: { label: "Champions", icon: "🏆", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/25" },
    collectorsOnly: { label: "Collectors Only", icon: "📦", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/25" },
    atRisk: { label: "At Risk", icon: "⚠️", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/25" },
    newThisWeek: { label: "New This Week", icon: "✨", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
};

function CollectorCard({ c }: { c: CollectorLoyalty }) {
    return (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-muted/30">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary flex-shrink-0 overflow-hidden">
                {c.image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={c.image} className="w-8 h-8 object-cover" alt={c.name} />
                    : c.name.charAt(0).toUpperCase()
                }
            </div>
            <div className="flex flex-col gap-0 flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-foreground truncate">{c.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                <p className="text-[10px] text-muted-foreground">
                    Last seen {c.daysSinceLastSeen != null ? `${c.daysSinceLastSeen}d ago` : fmt(c.lastCollectedAt)}
                </p>
            </div>
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span className="text-[11px] font-bold text-foreground tabular-nums">
                    {c.totalCollected} collected
                </span>
                <span className="text-[10px] font-semibold text-primary">
                    {c.redemptionRate} redeemed
                </span>
            </div>
        </div>
    );
}

export function CollectorLoyaltyBlock({ data, onLoadMore, isLoadingMore, isSlate }: Props) {
    const [activeTab, setActiveTab] = useState<Segment>("champions");

    const segments = data.segments;
    const activeCollectors = (segments[activeTab] ?? []);
    const cfg = SEGMENT_CONFIG[activeTab];

    return (
        <div className="flex flex-col gap-3">

            {/* Header */}
            <div className="flex items-center gap-2">
                <span className="text-base">💎</span>
                <p className="text-[13px] font-bold text-foreground">Collector Loyalty</p>
            </div>

            {/* Segment summary tabs */}
            <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(SEGMENT_CONFIG) as Segment[]).map((seg) => {
                    const c = SEGMENT_CONFIG[seg];
                    const count = (segments[seg] ?? []).length;
                    const isActive = seg === activeTab;
                    return (
                        <button
                            key={seg}
                            onClick={() => setActiveTab(seg)}
                            className={cn(
                                "flex flex-col items-start gap-0.5 px-3 py-2 rounded-xl border transition-all text-left",
                                isActive ? `${c.bg} ${c.border}` : "border-border bg-muted/30 hover:bg-muted/50",
                            )}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm">{c.icon}</span>
                                <span className={cn("text-[11px] font-bold", isActive ? c.color : "text-foreground")}>
                                    {c.label}
                                </span>
                            </div>
                            <span className={cn("text-[13px] font-black tabular-nums", isActive ? c.color : "text-muted-foreground")}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Active segment collector list */}
            {activeCollectors.length === 0 ? (
                <p className="text-[12px] text-muted-foreground italic px-1">
                    No {cfg.label.toLowerCase()} collectors yet.
                </p>
            ) : (
                <div className="flex flex-col gap-1.5">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        {cfg.icon} {cfg.label} ({activeCollectors.length})
                    </p>
                    {activeCollectors.map((c, i) => (
                        <CollectorCard key={i} c={c} />
                    ))}
                </div>
            )}

            {/* Top loyal */}
            {data.topLoyal.length > 0 && activeTab !== "champions" && (
                <div className="flex flex-col gap-1.5 mt-1">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        🏅 Top 10 Overall
                    </p>
                    {data.topLoyal.slice(0, 5).map((c, i) => (
                        <CollectorCard key={i} c={c} />
                    ))}
                </div>
            )}

            <PaginationFooter
                pagination={data.pagination}
                onLoadMore={onLoadMore ?? (() => undefined)}
                isLoading={isLoadingMore ?? false}
                entityLabel="collectors"
                isSlate={isSlate}
            />
        </div>
    );
}