"use client";

import { useState } from "react";
import { SectionHeader } from "~/components/agent/shared/section-header";
import { PaginationFooter } from "~/components/agent/shared/pagination-footer";
import { PinRow, type PinRowData } from "~/components/agent/pins/pin-row";
import { PinEditForm, type PinEditFields, type HotspotScope, type LocationEditFields, type PinData } from "~/components/agent/pins/pin-edit-form";
import { PinDeleteDialog, type DeleteTarget } from "~/components/agent/pins/pin-delete-dialog";
import { HotspotListBlock } from "~/components/agent/blocks/hotspot-list-block";
import type { HotspotEditFields } from "~/components/agent/hotspot/hotspot-edit-form";
import type { PinListData } from "~/types/agent/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeoContext {
    area: string;
    radiusKm: number;
}

interface PinListBlockProps {
    data: PinListData;
    geoContext?: GeoContext;                    // ← NEW
    onEdit?: (ids: string[], fields: PinEditFields, scope?: HotspotScope, locationEdits?: Record<string, LocationEditFields>) => void;
    onDelete?: (ids: string[]) => void;
    onPauseHotspot?: (hotspotId: string) => void;
    onResumeHotspot?: (hotspotId: string) => void;
    onEditHotspot?: (hotspotId: string, fields: HotspotEditFields) => void;
    onDeleteHotspot?: (hotspotId: string) => void;
    onLoadMore?: (nextOffset: number) => void;
    isLoadingMore?: boolean;
    isSlate?: boolean;  // whether this block is rendered in a "slate" style (used for all but the last block in a message)
}

// ─── PinListBlock ─────────────────────────────────────────────────────────────

export function PinListBlock({
    data,
    geoContext,                                // ← NEW
    onEdit, onDelete,
    onPauseHotspot, onResumeHotspot, onEditHotspot, onDeleteHotspot,
    onLoadMore, isLoadingMore, isSlate,
}: PinListBlockProps) {
    const [editingPin, setEditingPin] = useState<PinRowData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[]>([]);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const standalone = (data.standalone ?? []) as PinRowData[];
    const hotspots = data.hotspots ?? [];
    const hasStandalone = standalone.length > 0;
    const hasHotspots = hotspots.length > 0;

    if (!hasStandalone && !hasHotspots) {
        return <p className="text-[13px] text-muted-foreground italic">No pins found.</p>;
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleEditClick = (pin: PinRowData) => {
        setEditingPin(prev => prev?.id === pin.id ? null : pin);
    };

    const handleEditSubmit = async (
        fields: PinEditFields,
        scope: HotspotScope,
        locationEdits: Record<string, LocationEditFields>,
    ) => {
        if (!editingPin || !onEdit) return;
        setIsSubmitting(true);
        try {
            onEdit([editingPin.id], fields, scope, locationEdits);
            setEditingPin(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (pin: PinRowData) => {
        const targets = selectedIds.has(pin.id) && selectedIds.size > 1
            ? standalone.filter(p => selectedIds.has(p.id))
            : [pin];
        setDeleteTargets(targets);
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (!onDelete) return;
        setIsDeleting(true);
        try {
            onDelete(deleteTargets.map(p => p.id));
            setSelectedIds(new Set());
            setShowDeleteDialog(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const renderPinWithForm = (pin: PinRowData, indent = false, isSlate = false) => (
        <div key={pin.id} className="flex flex-col gap-1.5">
            <PinRow
                pin={pin}
                mode="edit"
                indent={indent}
                isSlate={isSlate}
                isSelected={selectedIds.has(pin.id)}
                isEditing={editingPin?.id === pin.id}
                onToggleSelect={toggleSelect}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
            />
            {editingPin?.id === pin.id && (
                <div className="rounded-xl border border-primary/30 bg-background p-4 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[12px] font-bold text-foreground">Editing: {pin.title}</p>
                        <button
                            onClick={() => setEditingPin(null)}
                            className="text-[10px] text-muted-foreground hover:text-foreground"
                        >
                            ✕ Close
                        </button>
                    </div>
                    <PinEditForm
                        pin={editingPin as PinData}
                        onSubmit={handleEditSubmit}
                        onCancel={() => setEditingPin(null)}
                        isSubmitting={isSubmitting}
                    />
                </div>
            )}
        </div>
    );

    return (
        <>
            <div className="flex flex-col gap-3">

                {/* ── Geo context header ── NEW ─────────────────────────────── */}
                {geoContext && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border/50">
                        <span className="text-base">🌍</span>
                        <span className="text-[12px] font-semibold text-foreground">
                            {geoContext.area}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            within {geoContext.radiusKm} km
                        </span>
                    </div>
                )}

                {selectedIds.size > 1 && (
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25">
                        <span className="text-[12px] font-semibold text-red-400">
                            {selectedIds.size} pins selected
                        </span>
                        <button
                            onClick={() => {
                                setDeleteTargets(standalone.filter(p => selectedIds.has(p.id)));
                                setShowDeleteDialog(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-[11px] font-bold"
                        >
                            Delete Selected ({selectedIds.size})
                        </button>
                    </div>
                )}

                {hasStandalone && (
                    <section className="flex flex-col gap-2">
                        <SectionHeader label="Standalone" count={standalone.length} icon="📍" />
                        <div className="flex flex-col gap-2">
                            {standalone.map(pin => renderPinWithForm(pin, false, isSlate))}
                        </div>
                    </section>
                )}

                {hasHotspots && (
                    <HotspotListBlock
                        hotspots={hotspots}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onPauseHotspot={onPauseHotspot}
                        onResumeHotspot={onResumeHotspot}
                        onEditHotspot={onEditHotspot}
                        onDeleteHotspot={onDeleteHotspot}
                        isSlate={isSlate}
                    />
                )}

                {onLoadMore && (
                    <PaginationFooter
                        pagination={data.pagination ?? null}
                        onLoadMore={onLoadMore}
                        isLoading={isLoadingMore ?? false}
                        entityLabel="pins"
                        isSlate={isSlate}
                    />
                )}
            </div>

            <PinDeleteDialog
                targets={deleteTargets}
                open={showDeleteDialog}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteDialog(false)}
                isDeleting={isDeleting}
            />
        </>
    );
}