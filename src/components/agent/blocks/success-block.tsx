"use client";

import type { SuccessResponse } from "~/types/agent/types";

// ─── SuccessBlock ─────────────────────────────────────────────────────────────

export function SuccessBlock({ data }: { data: SuccessResponse }) {
    return (
        <div className="mt-2 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <span className="text-2xl flex-shrink-0">🎉</span>
            <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-emerald-400 text-sm font-bold leading-snug">
                    {data.message}
                </p>
                {data.count > 0 && (
                    <p className="text-emerald-500/70 text-xs">
                        {data.count} pin{data.count !== 1 ? "s" : ""} saved
                    </p>
                )}
            </div>
        </div>
    );
}