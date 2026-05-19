"use client";

import { PinRow, type PinRowData, type PinRowMode } from "~/components/agent/pins/pin-row";
import { PinEditForm, type PinEditFields, type HotspotScope, type LocationEditFields, type PinData } from "~/components/agent/pins/pin-edit-form";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HotspotDropRowProps {
    drop: PinRowData & Partial<PinData>; // PinRowData for display, PinData for edit
    mode: PinRowMode;
    isEditing: boolean;
    isSubmitting: boolean;
    isSelected?: boolean;
    onEdit: (drop: PinRowData) => void;
    onDelete: (drop: PinRowData) => void;
    onToggleSelect?: (id: string) => void;
    onEditSubmit: (
        fields: PinEditFields,
        scope: HotspotScope,
        locationEdits: Record<string, LocationEditFields>,
    ) => void;
    onEditCancel: () => void;
}

// ─── HotspotDropRow ───────────────────────────────────────────────────────────

export function HotspotDropRow({
    drop,
    mode,
    isEditing,
    isSubmitting,
    isSelected,
    onEdit,
    onDelete,
    onToggleSelect,
    onEditSubmit,
    onEditCancel,
}: HotspotDropRowProps) {
    return (
        <div className="flex flex-col gap-1.5">
            {/* ── The row itself ─────────────────────────────────────────────────── */}
            <PinRow
                pin={drop}
                mode={mode}
                indent
                isEditing={isEditing}
                isSelected={isSelected}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleSelect={onToggleSelect}
            />

            {/* ── Inline edit form — only when this drop is being edited ─────────── */}
            {isEditing && (
                <div className="ml-4 rounded-xl border border-primary/30 bg-background p-4 shadow-lg">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[12px] font-bold text-foreground truncate pr-2">
                            Editing: {drop.title}
                        </p>
                        <button
                            onClick={onEditCancel}
                            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        >
                            ✕ Close
                        </button>
                    </div>

                    {/* Form — cast to PinData; hotspotId ensures scope selector renders */}
                    <PinEditForm
                        pin={drop as PinData}
                        onSubmit={onEditSubmit}
                        onCancel={onEditCancel}
                        isSubmitting={isSubmitting}
                    />
                </div>
            )}
        </div>
    );
}