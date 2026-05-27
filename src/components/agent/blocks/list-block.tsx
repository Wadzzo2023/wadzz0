"use client";

import { useState } from "react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/shadcn/ui/button";
import { Trash2, Pencil, PauseCircle, PlayCircle } from "lucide-react";
import type { PinListPinRow, HotspotRow, PinListMode, HotspotListMode } from "~/types/agent/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ListItem {
    id: string;
    label: string;
    sublabel?: string | null;
    hotspotId?: string | null;
}

interface ListBlockProps {
    message: string;
    items: ListItem[];
    action: PinListMode | HotspotListMode;
    onConfirm: (selectedIds: string[]) => void;
    onDismiss: () => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACTION_LABEL: Record<string, string> = {
    edit: "Edit",
    delete: "Delete",
    pause: "Pause",
    resume: "Resume",
};

const ACTION_STYLE: Record<string, string> = {
    edit: "bg-primary text-primary-foreground hover:bg-primary/90",
    delete: "bg-red-500 text-white hover:bg-red-600",
    pause: "bg-amber-500 text-white hover:bg-amber-600",
    resume: "bg-emerald-500 text-white hover:bg-emerald-600",
};

const ACTION_ICON: Record<string, React.ReactNode> = {
    edit: <Pencil className="w-3.5 h-3.5" />,
    delete: <Trash2 className="w-3.5 h-3.5" />,
    pause: <PauseCircle className="w-3.5 h-3.5" />,
    resume: <PlayCircle className="w-3.5 h-3.5" />,
};

// ─── Helpers — convert response rows to ListItems ─────────────────────────────

export function pinRowsToListItems(pins: PinListPinRow[]): ListItem[] {
    return pins.map((p) => ({
        id: p.id,
        label: p.title,
        sublabel: p.startDate && p.endDate
            ? `${p.startDate} – ${p.endDate}`
            : null,
        hotspotId: p.hotspotId ?? null,
    }));
}

export function hotspotRowsToListItems(hotspots: HotspotRow[]): ListItem[] {
    return hotspots.map((h) => ({
        id: h.id,
        label: h.hotspotName,
        sublabel: h.isActive ? "Active" : "Paused",
        hotspotId: h.id,
    }));
}

// ─── ListBlock ────────────────────────────────────────────────────────────────

export function ListBlock({ message, items, action, onConfirm, onDismiss }: ListBlockProps) {
    const [selected, setSelected] = useState<Set<string>>(
        () => new Set(items.map(i => i.id))
    );

    const toggle = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const selectAll = () => setSelected(new Set(items.map(i => i.id)));
    const deselectAll = () => setSelected(new Set());

    const selectedCount = selected.size;
    const totalCount = items.length;
    const label = ACTION_LABEL[action] ?? "Confirm";
    const style = ACTION_STYLE[action] ?? "bg-primary text-primary-foreground";
    const icon = ACTION_ICON[action];

    return (
        <div className="flex flex-col gap-2">
            <p className="text-[13px] text-foreground leading-relaxed">{message}</p>

            {/* Select all / deselect all */}
            <div className="flex items-center gap-2">
                <button
                    onClick={selectAll}
                    className="text-[10px] text-primary hover:underline"
                >
                    Select all
                </button>
                <span className="text-[10px] text-muted-foreground">·</span>
                <button
                    onClick={deselectAll}
                    className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                >
                    Deselect all
                </button>
                <span className="text-[10px] text-muted-foreground ml-auto">
                    {selectedCount}/{totalCount} selected
                </span>
            </div>

            {/* Item list */}
            <div className="flex flex-col gap-1.5">
                {items.map(item => {
                    const isChecked = selected.has(item.id);
                    return (
                        <button
                            key={item.id}
                            onClick={() => toggle(item.id)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-left border transition-all duration-150 active:scale-[0.98]",
                                isChecked
                                    ? "bg-primary/10 border-primary/40"
                                    : "bg-muted/40 border-border opacity-50"
                            )}
                        >
                            {/* Checkbox */}
                            <div className={cn(
                                "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                                isChecked ? "bg-primary border-primary" : "border-muted-foreground bg-transparent"
                            )}>
                                {isChecked && (
                                    <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none"
                                        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 4l3 3 5-6" />
                                    </svg>
                                )}
                            </div>

                            {/* Label */}
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                <span className="text-[12px] font-semibold text-foreground truncate">
                                    {item.label}
                                </span>
                                {item.sublabel && (
                                    <span className="text-[10px] text-muted-foreground">{item.sublabel}</span>
                                )}
                                {item.hotspotId && (
                                    <span className="text-[10px] text-blue-400">🔁 hotspot-linked</span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-1">
                <Button
                    onClick={() => onConfirm(Array.from(selected))}
                    disabled={selectedCount === 0}
                    className={cn(
                        "flex-1 h-9 text-xs font-bold gap-1.5 transition-all active:scale-95 disabled:opacity-40",
                        style
                    )}
                >
                    {icon}
                    {label} Selected ({selectedCount})
                </Button>

                {selectedCount < totalCount && (
                    <Button
                        variant="outline"
                        onClick={() => onConfirm(items.map(i => i.id))}
                        className="px-3 h-9 text-xs font-bold gap-1.5"
                    >
                        {label} All ({totalCount})
                    </Button>
                )}

                <Button
                    variant="outline"
                    onClick={onDismiss}
                    className="px-3 h-9 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}