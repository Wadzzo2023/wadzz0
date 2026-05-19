"use client";

import { cn } from "~/lib/utils";

interface MetricCardProps {
    label: string;
    value: number | string;
    highlight?: boolean;
}

export function MetricCard({ label, value, highlight = false }: MetricCardProps) {
    return (
        <div className={cn(
            "flex flex-col gap-0.5 px-3 py-2.5 rounded-xl border",
            highlight ? "bg-primary/10 border-primary/25" : "bg-muted/30 border-border"
        )}>
            <span className="text-[10px] text-muted-foreground">{label}</span>
            <span className={cn(
                "text-base font-bold tabular-nums",
                highlight ? "text-primary" : "text-foreground"
            )}>
                {value}
            </span>
        </div>
    );
}