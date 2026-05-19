"use client";

import { cn, fmt } from "~/lib/utils";
import { StatusBadge } from "~/components/agent/shared/status-badge";
import { Stat } from "~/components/agent/shared/stat";
import { ActionButtons } from "~/components/agent/shared/action-button";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PinRowMode = "view" | "edit" | "delete";

export interface PinRowData {
    id: string;
    title: string;
    startDate: string | null;
    endDate: string | null;
    status: string;
    claimed: number;
    redeemed: number;
    remaining: number;
    hotspotId?: string | null;
    locations?: {
        id: string;
        latitude: number;
        longitude: number;
        autoCollect: boolean;
        hidden: boolean;
    }[];
}

interface PinRowProps {
    pin: PinRowData;
    mode: PinRowMode;
    indent?: boolean;
    isSelected?: boolean;
    isEditing?: boolean;
    isSlate?: boolean;
    onToggleSelect?: (id: string) => void;
    onEdit?: (pin: PinRowData) => void;
    onDelete?: (pin: PinRowData) => void;
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({ checked, onChange, color = "primary", isSlate }: {
    checked: boolean;
    onChange: () => void;
    color?: "primary" | "red";
    disabled?: boolean;
    isSlate?: boolean;
}) {
    return (
        <button
            disabled={isSlate}
            onClick={onChange}
            className={cn(
                "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                isSlate && "cursor-not-allowed border-muted-foreground/30 bg-transparent",
                checked
                    ? color === "red"
                        ? "bg-red-500 border-red-500"
                        : "bg-primary border-primary"
                    : "border-muted-foreground/40 bg-transparent hover:border-primary"
            )}
        >
            {checked && (
                <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none"
                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4l3 3 5-6" />
                </svg>
            )}
        </button>
    );
}

// ─── PinRow ───────────────────────────────────────────────────────────────────

export function PinRow({
    pin, mode, indent = false, isSlate = false,
    isSelected = false, isEditing = false,
    onToggleSelect, onEdit, onDelete,
}: PinRowProps) {
    const showCheckbox = mode === "edit" || mode === "delete";

    return (
        <div className={cn(
            "flex flex-col gap-0 rounded-xl border bg-muted/30 overflow-hidden transition-all",
            indent && "ml-4 border-l-2 border-l-primary/20",
            isEditing && "border-primary/40 bg-primary/5",
            isSelected && !isEditing && mode === "delete" && "border-red-500/30 bg-red-500/5",
            isSelected && !isEditing && mode === "edit" && "border-primary/30 bg-primary/5",
            !isSelected && !isEditing && "border-border",
        )}>
            <div className="flex flex-col gap-1.5 px-3 py-2.5">

                {/* Title row */}
                <div className="flex items-center gap-2 min-w-0">
                    {showCheckbox && (
                        <Checkbox
                            checked={isSelected}
                            isSlate={isSlate}
                            onChange={() => onToggleSelect?.(pin.id)}
                            color={mode === "delete" ? "red" : "primary"}
                        />
                    )}
                    <p className="text-[12px] font-semibold text-foreground truncate flex-1">
                        {pin.title}
                    </p>
                    <StatusBadge status={pin.status} />
                </div>

                {/* Date range */}
                <p className={cn("text-[11px] text-muted-foreground", showCheckbox && "pl-6")}>
                    {fmt(pin.startDate)} → {fmt(pin.endDate)}
                </p>

                {/* Stats */}
                <div className={cn("flex items-center gap-3 flex-wrap", showCheckbox && "pl-6")}>
                    <Stat label="Claimed" value={pin.claimed} />
                    <Stat label="Redeemed" value={pin.redeemed} />
                    <Stat label="Remaining" value={pin.remaining} dim={pin.remaining === 0} />
                </div>

                {/* Actions — only for edit mode */}
                {mode === "edit" && (
                    <div className={cn("flex items-center gap-2 pt-0.5", showCheckbox && "pl-6")}>
                        <ActionButtons
                            onEdit={onEdit ? () => onEdit(pin) : undefined}
                            onDelete={onDelete ? () => onDelete(pin) : undefined}
                            isSlate={isSlate}
                        />
                        {pin.hotspotId && (
                            <span className="text-[10px] text-blue-400 ml-auto">🔁 hotspot</span>
                        )}
                    </div>
                )}

                {/* Delete mode — hotspot tag only */}
                {mode === "delete" && pin.hotspotId && (
                    <span className={cn("text-[10px] text-blue-400", showCheckbox && "pl-6")}>
                        🔁 hotspot
                    </span>
                )}
            </div>
        </div>
    );
}