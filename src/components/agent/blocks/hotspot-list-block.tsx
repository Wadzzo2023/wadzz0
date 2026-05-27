"use client";

import { SectionHeader } from "~/components/agent/shared/section-header";
import { HotspotTile } from "~/components/agent/hotspot/hotspot-title";
import type { PinEditFields, HotspotScope, LocationEditFields } from "~/components/agent/pins/pin-edit-form";
import type { HotspotEditFields } from "~/components/agent/hotspot/hotspot-edit-form";
import type { HotspotRow } from "~/types/agent/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HotspotListBlockProps {
    hotspots: HotspotRow[];
    onEdit?: (ids: string[], fields: PinEditFields, scope?: HotspotScope, locationEdits?: Record<string, LocationEditFields>) => void;
    onDelete?: (ids: string[]) => void;
    onEditHotspot?: (hotspotId: string, fields: HotspotEditFields) => void;
    onDeleteHotspot?: (hotspotId: string) => void;
    onPauseHotspot?: (hotspotId: string) => void;
    onResumeHotspot?: (hotspotId: string) => void;
    isSlate?: boolean;  // whether this block is rendered in a "slate" style (used for all but the last block in a message)
}

// ─── HotspotListBlock ─────────────────────────────────────────────────────────

export function HotspotListBlock({
    hotspots,
    onEdit, onDelete,
    onEditHotspot, onDeleteHotspot, onPauseHotspot, onResumeHotspot,
    isSlate = false,
}: HotspotListBlockProps) {
    if (hotspots.length === 0) return null;

    return (
        <section className="flex flex-col gap-2">
            <SectionHeader label="Hotspots" count={hotspots.length} icon="🔁" />
            <div className="flex flex-col gap-3">
                {hotspots.map((hs, i) => (
                    <HotspotTile
                        key={hs.id ?? i}
                        hotspot={hs}
                        onEditPin={onEdit}
                        onDeletePin={onDelete}
                        onEditHotspot={onEditHotspot}
                        onDeleteHotspot={onDeleteHotspot}
                        onPauseHotspot={onPauseHotspot}
                        onResumeHotspot={onResumeHotspot}
                        isSlate={isSlate}
                    />
                ))}
            </div>
        </section>
    );
}