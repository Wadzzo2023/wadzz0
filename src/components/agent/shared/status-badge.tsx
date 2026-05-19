"use client";

import { cn } from "~/lib/utils";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    active: { label: "Active", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
    expired: { label: "Expired", cls: "bg-muted text-muted-foreground border-border" },
    fully_claimed: { label: "Fully Claimed", cls: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
    collection_disabled: { label: "Collection Off", cls: "bg-red-500/15 text-red-400 border-red-500/25" },
};

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const { label, cls } = STATUS_MAP[status] ?? {
        label: status,
        cls: "bg-muted text-muted-foreground border-border",
    };
    return (
        <span className={cn(
            "inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border flex-shrink-0",
            cls, className
        )}>
            {label}
        </span>
    );
}