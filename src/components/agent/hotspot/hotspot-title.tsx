"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "~/lib/utils";
import { ActionButtons } from "~/components/agent/shared/action-button";
import { PinRow, type PinRowData } from "~/components/agent/pins/pin-row";
import { PinEditForm, type PinEditFields, type HotspotScope, type LocationEditFields, type PinData } from "~/components/agent/pins/pin-edit-form";
import { PinDeleteDialog, type DeleteTarget } from "~/components/agent/pins/pin-delete-dialog";
import { HotspotEditForm, type HotspotEditFields } from "~/components/agent/hotspot/hotspot-edit-form";
import type { HotspotRow, HotspotLocationGroup } from "~/types/agent/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HotspotTileProps {
    hotspot: HotspotRow;
    onEditPin?: (ids: string[], fields: PinEditFields, scope?: HotspotScope, locationEdits?: Record<string, LocationEditFields>) => void;
    onDeletePin?: (ids: string[]) => void;
    onEditHotspot?: (hotspotId: string, fields: HotspotEditFields) => void;
    onDeleteHotspot?: (hotspotId: string) => void;
    onPauseHotspot?: (hotspotId: string) => void;
    onResumeHotspot?: (hotspotId: string) => void;
    isSlate?: boolean;  // whether this tile is rendered in a "slate" style (used for all but the last tile in a message)
}

// ─── Helper — map HotspotLocationGroup to PinRowData ─────────────────────────

function locationGroupToPinRow(lg: HotspotLocationGroup): PinRowData {
    return {
        id: lg.id,
        title: lg.title,
        startDate: lg.startDate,
        endDate: lg.endDate,
        status: lg.status,
        claimed: lg.claimed,
        redeemed: lg.redeemed,
        remaining: lg.remaining,
        locations: lg.locations,
    };
}

// ─── HotspotTile ──────────────────────────────────────────────────────────────

export function HotspotTile({
    hotspot,
    onEditPin, onDeletePin,
    onEditHotspot, onDeleteHotspot, onPauseHotspot, onResumeHotspot,
    isSlate = false,
}: HotspotTileProps) {
    const [expanded, setExpanded] = useState(false);
    const [editingHotspot, setEditingHotspot] = useState(false);
    const [isHsSubmitting, setIsHsSubmitting] = useState(false);
    const [editingDrop, setEditingDrop] = useState<PinRowData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[]>([]);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // ── Map locationGroups to PinRowData once ────────────────────────────────
    const drops: PinRowData[] = hotspot.locationGroups.map(locationGroupToPinRow);

    // ── Hotspot actions ──────────────────────────────────────────────────────

    const handleHotspotEditSubmit = async (hotspotId: string, fields: HotspotEditFields) => {
        if (!onEditHotspot) return;
        setIsHsSubmitting(true);
        try { onEditHotspot(hotspotId, fields); setEditingHotspot(false); }
        finally { setIsHsSubmitting(false); }
    };

    // ── Drop actions ─────────────────────────────────────────────────────────

    const handleDropEditSubmit = async (
        fields: PinEditFields,
        scope: HotspotScope,
        locationEdits: Record<string, LocationEditFields>,
    ) => {
        if (!editingDrop || !onEditPin) return;
        setIsSubmitting(true);
        try { onEditPin([editingDrop.id], fields, scope, locationEdits); setEditingDrop(null); }
        finally { setIsSubmitting(false); }
    };

    const handleDropDeleteClick = (drop: PinRowData) => {
        setDeleteTargets([drop]);
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (!onDeletePin) return;
        setIsDeleting(true);
        try { onDeletePin(deleteTargets.map(d => d.id)); setShowDeleteDialog(false); }
        finally { setIsDeleting(false); }
    };

    return (
        <>
            <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">

                {/* ── Hotspot header ──────────────────────────────────────────────── */}
                <div className="flex flex-col gap-2 px-3 py-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center gap-2 flex-1 min-w-0 text-left"
                        >
                            <span className="text-sm">🔁</span>
                            <span className="text-[13px] font-bold text-foreground truncate">
                                {hotspot.hotspotName}
                            </span>
                            <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-semibold border flex-shrink-0",
                                hotspot.isActive
                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                                    : "bg-muted text-muted-foreground border-border"
                            )}>
                                {hotspot.isActive ? "active" : "paused"}
                            </span>
                            {hotspot.dropCount != null && (
                                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                    {hotspot.dropCount} drops
                                </span>
                            )}
                            <span className="ml-auto flex-shrink-0">
                                {expanded
                                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                }
                            </span>
                        </button>
                    </div>

                    {/* Hotspot action buttons */}
                    <ActionButtons
                        onEdit={onEditHotspot ? () => setEditingHotspot(prev => !prev) : undefined}
                        onDelete={onDeleteHotspot ? () => onDeleteHotspot(hotspot.id) : undefined}
                        onPause={onPauseHotspot ? () => onPauseHotspot(hotspot.id) : undefined}
                        onResume={onResumeHotspot ? () => onResumeHotspot(hotspot.id) : undefined}
                        isActive={hotspot.isActive}
                        size="xs"
                        isSlate={isSlate}
                    />
                </div>

                {/* ── Hotspot edit form ────────────────────────────────────────────── */}
                {editingHotspot && (
                    <div className="border-t border-border px-3 py-3 bg-background">
                        <HotspotEditForm
                            hotspot={{
                                id: hotspot.id,
                                displayName: hotspot.hotspotName,
                                isActive: hotspot.isActive,
                                dropEveryDays: hotspot.dropEveryDays,
                                dropCount: hotspot.dropCount,
                            }}
                            onSubmit={handleHotspotEditSubmit}
                            onCancel={() => setEditingHotspot(false)}
                            isSubmitting={isHsSubmitting}
                        />
                    </div>
                )}

                {/* ── Drops list ───────────────────────────────────────────────────── */}
                {expanded && drops.length > 0 && (
                    <div className="border-t border-border px-3 py-3 flex flex-col gap-2">
                        {drops.map(drop => (
                            <div key={drop.id} className="flex flex-col gap-1.5">
                                <PinRow
                                    pin={drop}
                                    mode="edit"
                                    indent
                                    isEditing={editingDrop?.id === drop.id}
                                    onEdit={(p) => setEditingDrop(prev => prev?.id === p.id ? null : p)}
                                    onDelete={handleDropDeleteClick}
                                />

                                {editingDrop?.id === drop.id && (
                                    <div className="ml-4 rounded-xl border border-primary/30 bg-background p-4 shadow-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[12px] font-bold text-foreground">
                                                Editing: {drop.title}
                                            </p>
                                            <button
                                                onClick={() => setEditingDrop(null)}
                                                className="text-[10px] text-muted-foreground hover:text-foreground"
                                            >
                                                ✕ Close
                                            </button>
                                        </div>
                                        <PinEditForm
                                            pin={editingDrop as PinData}
                                            onSubmit={handleDropEditSubmit}
                                            onCancel={() => setEditingDrop(null)}
                                            isSubmitting={isSubmitting}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {expanded && drops.length === 0 && (
                    <div className="border-t border-border px-3 py-3">
                        <p className="text-[12px] text-muted-foreground italic">No drops yet.</p>
                    </div>
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