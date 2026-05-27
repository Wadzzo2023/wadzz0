"use client";

import { cn, fmt } from "~/lib/utils";
import type { AreaRecommendationResponse } from "~/types/agent/types";

interface Props {
    data: AreaRecommendationResponse["data"];
    // called when creator wants to drop pins at a recommended area
    onDropHere?: (area: string) => void;
}

export function AreaRecommendationBlock({ data, onDropHere }: Props) {
    const { area, recommendations, avoidAreas, yourPatterns, generatedAt } = data;

    return (
        <div className="flex flex-col gap-4">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className="text-base">🗺️</span>
                        <p className="text-[13px] font-bold text-foreground">
                            Best Drop Areas
                        </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground pl-7">
                        {area} · based on your history + live data
                    </p>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {fmt(generatedAt)}
                </span>
            </div>

            {/* ── Recommendations ────────────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
                {recommendations.map((rec) => (
                    <div
                        key={rec.rank}
                        className="flex flex-col gap-2 px-3 py-3 rounded-xl border border-border bg-muted/20"
                    >
                        {/* Rank + area */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "text-[13px] font-black w-6 flex-shrink-0 tabular-nums",
                                    rec.rank === 1 ? "text-amber-400" :
                                        rec.rank === 2 ? "text-slate-400" :
                                            rec.rank === 3 ? "text-amber-700" : "text-muted-foreground",
                                )}>
                                    #{rec.rank}
                                </span>
                                <div className="flex flex-col gap-0">
                                    <p className="text-[13px] font-bold text-foreground">{rec.area}</p>
                                    {rec.isUntried && (
                                        <span className="text-[10px] text-emerald-400 font-semibold">
                                            ✨ Untried area
                                        </span>
                                    )}
                                </div>
                            </div>
                            {onDropHere && (
                                <button
                                    onClick={() => onDropHere(rec.area)}
                                    className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold hover:bg-primary/90 transition-colors flex-shrink-0"
                                >
                                    Drop here →
                                </button>
                            )}
                        </div>

                        {/* Your history */}
                        {rec.yourHistory && (
                            <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-primary/5 border border-primary/15">
                                <span className="text-[11px] flex-shrink-0">📊</span>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold text-primary/80 uppercase tracking-wider">Your History</span>
                                    <p className="text-[11px] text-foreground">{rec.yourHistory}</p>
                                </div>
                            </div>
                        )}

                        {/* Real-world data */}
                        {rec.realWorldData && (
                            <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                                <span className="text-[11px] flex-shrink-0">🌍</span>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider">Live Data</span>
                                    <p className="text-[11px] text-foreground">{rec.realWorldData}</p>
                                </div>
                            </div>
                        )}

                        {/* Recommendation */}
                        <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
                            <span className="text-[11px] flex-shrink-0">💡</span>
                            <p className="text-[11px] text-foreground font-semibold">{rec.recommendation}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Avoid areas ────────────────────────────────────────────────── */}
            {avoidAreas.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider">
                        ⚠️ Avoid
                    </p>
                    {avoidAreas.map((a, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-2.5 px-3 py-2 rounded-xl border border-red-500/20 bg-red-500/5"
                        >
                            <span className="text-[11px] text-red-400 flex-shrink-0 font-bold">✗</span>
                            <div className="flex flex-col gap-0">
                                <p className="text-[12px] font-semibold text-foreground">{a.area}</p>
                                <p className="text-[11px] text-muted-foreground">{a.reason}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Your patterns ──────────────────────────────────────────────── */}
            <div className="flex flex-col gap-2 px-3 py-3 rounded-xl border border-border bg-muted/30">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Your Patterns
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">Best type:</span>
                        <span className="text-[11px] font-bold text-foreground">{yourPatterns.bestPinType}</span>
                    </div>
                    {yourPatterns.bestRadius && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground">Best radius:</span>
                            <span className="text-[11px] font-bold text-foreground">{yourPatterns.bestRadius}m</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">Best day:</span>
                        <span className="text-[11px] font-bold text-foreground">{yourPatterns.bestDay}</span>
                    </div>
                    {yourPatterns.bestHour != null && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground">Best hour:</span>
                            <span className="text-[11px] font-bold text-foreground">
                                {yourPatterns.bestHour}:00
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}