"use client";

import { cn } from "~/lib/utils";

interface StatProps {
    label: string;
    value: number | string;
    dim?: boolean;
    highlight?: boolean;
}

export function Stat({ label, value, dim = false, highlight = false }: StatProps) {
    return (
        <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">{label}:</span>
            <span className={cn(
                "text-[11px] font-bold tabular-nums",
                highlight ? "text-primary" : dim ? "text-muted-foreground" : "text-foreground"
            )}>
                {value}
            </span>
        </div>
    );
}