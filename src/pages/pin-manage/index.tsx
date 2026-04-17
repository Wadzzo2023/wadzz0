"use client";

import { useState, useMemo, useCallback } from "react";
import { format, isAfter, isBefore } from "date-fns";
import Image from "next/image";
import {
    Pencil,
    Trash2,
    ChevronDown,
    ChevronUp,
    Play,
    Pause,
    MapPin,
    Zap,
    Landmark,
    Calendar,
    Map,
    Circle,
    X,
} from "lucide-react";
import { api } from "~/utils/api";
import { toast } from "react-hot-toast";
import { UploadS3Button } from "~/components/common/upload-button";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "general" | "landmark" | "event" | "hotspot";

interface Location {
    id: string;
    latitude: number;
    longitude: number;
    autoCollect: boolean;
    hidden: boolean;
    _count: { consumers: number };
}

interface LocationGroup {
    id: string;
    title: string;
    description?: string | null;
    image?: string | null;
    link?: string | null;
    startDate: Date;
    endDate: Date;
    type: string;
    hotspotId?: string | null;
    locations: Location[];
}

interface Hotspot {
    id: string;
    dropEveryDays: number;
    pinDurationDays: number;
    hotspotStartDate: Date;
    hotspotEndDate: Date;
    shape: string;
    isActive: boolean;
    locationGroups: LocationGroup[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: Date | string) {
    return format(new Date(d), "MMM d, yyyy");
}

function fmtCoords(lat: number, lng: number) {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function getStatus(startDate: Date, endDate: Date) {
    const now = new Date();
    if (isBefore(now, new Date(startDate))) return "pending";
    if (isAfter(now, new Date(endDate))) return "expired";
    return "active";
}

const statusConfig = {
    active: { label: "Active", className: "bg-primary/10 text-primary border-primary/20" },
    expired: { label: "Expired", className: "bg-muted text-muted-foreground border-border" },
    pending: { label: "Pending", className: "bg-accent/10 text-accent border-accent/20" },
};

const typeConfig = {
    general: { label: "General", className: "bg-primary/10 text-primary border-primary/20", icon: Map },
    landmark: { label: "Landmark", className: "bg-secondary/20 text-secondary-foreground border-secondary/30", icon: Landmark },
    event: { label: "Event", className: "bg-accent/10 text-accent border-accent/20", icon: Calendar },
    hotspot: { label: "Hotspot", className: "bg-destructive/10 text-destructive border-destructive/20", icon: Zap },
};

// ─── Confirm Delete Modal ──────────────────────────────────────────────────────

interface ConfirmModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

function ConfirmModal({ title, message, onConfirm, onCancel, loading }: ConfirmModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-[90%] max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
                {/* Header */}
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                </div>

                {/* Message */}
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                    {message}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="rounded-lg border border-destructive/20 bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Deleting…" : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Edit Location Group Modal ─────────────────────────────────────────────────

interface EditGroupModalProps {
    group: LocationGroup;
    onSave: (data: {
        title?: string;
        description?: string;
        startDate?: Date;
        endDate?: Date;
        image?: string;
        link?: string;
    }) => void;
    onCancel: () => void;
    loading?: boolean;
}

function EditGroupModal({ group, onSave, onCancel, loading }: EditGroupModalProps) {
    const [title, setTitle] = useState(group.title);
    const [description, setDescription] = useState(group.description ?? "");
    const [image, setImage] = useState(group.image ?? "");
    const [imagePreview, setImagePreview] = useState(group.image ?? "");
    const [link, setLink] = useState(group.link ?? "");
    const [startDate, setStartDate] = useState(format(group.startDate, "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(format(group.endDate, "yyyy-MM-dd"));

    const isChanged =
        title !== group.title ||
        description !== (group.description ?? "") ||
        image !== (group.image ?? "") ||
        link !== (group.link ?? "");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            title: title !== group.title ? title : undefined,
            description: description !== (group.description ?? "") ? description : undefined,
            image: image !== (group.image ?? "") ? image : undefined,
            link: link !== (group.link ?? "") ? link : undefined,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
        });
    };

    const handleRemoveImage = () => {
        setImage("");
        setImagePreview("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
            <div className="w-[90%] max-w-lg rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Sticky Header */}
                <div className="border-b border-border bg-background/50 px-6 py-4 flex items-center justify-between backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Pencil size={16} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-foreground">Edit location group</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">{group.title}</p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Title Section */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary/20"
                                placeholder="Group title"
                            />
                        </div>

                        {/* Description Section */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary/20 resize-none"
                                placeholder="Add details about this location group..."
                                rows={3}
                            />
                        </div>

                        {/* Image Upload Section */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">Image</label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <UploadS3Button
                                        endpoint="imageUploader"
                                        onClientUploadComplete={(res) => {
                                            if (res?.url) {
                                                setImage(res.url);
                                                setImagePreview(res.url);
                                                toast.success("Image uploaded successfully");
                                            }
                                        }}
                                        onUploadError={(error: Error) => {
                                            toast.error(`Upload failed: ${error.message}`);
                                        }}
                                    />
                                </div>
                                {imagePreview && (
                                    <div className="relative group">
                                        <div className="relative h-16 w-16 rounded-lg border border-border overflow-hidden bg-muted">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-md transition group-hover:opacity-100"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {imagePreview && (
                                <p className="text-xs text-muted-foreground">Hover to remove</p>
                            )}
                        </div>

                        {/* Link Section */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">Link</label>
                            <input
                                type="url"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary/20"
                                placeholder="https://example.com"
                            />
                        </div>

                        {/* Date Section */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">Start date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">End date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Sticky Footer */}
                <div className="border-t border-border bg-background/50 px-6 py-4 flex items-center justify-between gap-3 backdrop-blur-sm">
                    <p className="text-xs text-muted-foreground">
                        {isChanged ? "You have unsaved changes" : "All changes saved"}
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground transition hover:bg-secondary hover:border-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={loading ?? !isChanged}
                            className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Saving…" : "Save changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Location Row ─────────────────────────────────────────────────────────────

interface LocationRowProps {
    loc: Location;
    groupId: string;
    checked: boolean;
    onToggle: (id: string, checked: boolean) => void;
    onDelete: (loc: Location) => void;
}

function LocationRow({ loc, groupId, checked, onToggle, onDelete }: LocationRowProps) {

    console.log("Rendering LocationRow", { loc, checked });
    return (
        <div className="flex items-center gap-2 rounded-lg border  bg-[var(--color-background-secondary)] px-3 py-2">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onToggle(loc.id, e.target.checked)}
                className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer accent-primary"
            />
            <span
                className={`h-2 w-2 flex-shrink-0 rounded-full ${loc.autoCollect ? "bg-primary" : "bg-muted-foreground"}`}
                title={loc.autoCollect ? "Auto-collect" : "Manual collect"}
            />
            <span className="flex-1 font-mono text-xs text-[var(--color-text-secondary)]">
                {fmtCoords(loc.latitude, loc.longitude)}
            </span>
            <span className="ml-auto whitespace-nowrap text-xs text-[var(--color-text-secondary)]">
                {loc._count.consumers} collected
            </span>
            <div className="flex gap-1">
                <button
                    onClick={() => onDelete(loc)}
                    className="flex h-6 w-6 items-center justify-center rounded border  text-[var(--color-text-secondary)] transition hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    title="Delete pin"
                >
                    <Trash2 size={11} />
                </button>
            </div>
        </div>
    );
}

// ─── Group Card ───────────────────────────────────────────────────────────────

interface GroupCardProps {
    group: LocationGroup;
    tab: Tab;
    isExpanded: boolean;
    isSelected: boolean;
    selectedLocIds: Set<string>;
    onToggleExpand: (id: string) => void;
    onToggleSelect: (id: string, checked: boolean) => void;
    onToggleLocSelect: (groupId: string, locId: string, checked: boolean) => void;
    onEdit: (group: LocationGroup) => void;
    onDeleteGroup: (group: LocationGroup) => void;
    onDeleteLocation: (groupId: string, loc: Location) => void;
    onDeleteSelectedLocs: (groupId: string) => void;
    onSelectAllLocs: (groupId: string, all: boolean) => void;
}

function GroupCard({
    group,
    tab,
    isExpanded,
    isSelected,
    selectedLocIds,
    onToggleExpand,
    onToggleSelect,
    onToggleLocSelect,
    onEdit,
    onDeleteGroup,
    onDeleteLocation,
    onDeleteSelectedLocs,
    onSelectAllLocs,
}: GroupCardProps) {
    const status = getStatus(group.startDate, group.endDate);
    const statusCfg = statusConfig[status];
    const typeCfg = typeConfig[tab];
    const allLocSelected =
        group.locations.length > 0 && group.locations.every((l) => selectedLocIds.has(l.id));
    const anyLocSelected = group.locations.some((l) => selectedLocIds.has(l.id));

    return (
        <div className={`overflow-hidden rounded-xl border   transition-shadow ${isExpanded ? "shadow-sm" : ""}`}>
            {/* Header */}
            <div className="flex cursor-pointer  items-center gap-2.5 px-3.5 py-3">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onToggleSelect(group.id, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer accent-primary"
                />
                {/* Thumb */}
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-background-secondary)] text-lg">
                    {group.image ? (
                        <img src={group.image} alt="" className="h-9 w-9 rounded-lg object-cover"
                            onError={(e) => {
                                e.currentTarget.src = "/images/logo.png"
                            }}
                        />
                    ) : (
                        <MapPin size={16} className="text-[var(--color-text-secondary)]" />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0" onClick={() => onToggleExpand(group.id)}>
                    <div className="truncate text-sm font-medium">{group.title}</div>
                    <div className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                        {fmtDate(group.startDate)} → {fmtDate(group.endDate)}&nbsp;·&nbsp;
                        {group.locations.length} pin{group.locations.length !== 1 ? "s" : ""}
                    </div>
                </div>

                {/* Badges */}
                <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${typeCfg.className}`}>
                    {typeCfg.label}
                </span>
                <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${statusCfg.className}`}>
                    {statusCfg.label}
                </span>

                {/* Actions */}
                <div className="flex flex-shrink-0 gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => onEdit(group)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border  text-[var(--color-text-secondary)] transition hover:bg-[var(--color-background-secondary)]"
                        title="Edit group"
                    >
                        <Pencil size={12} />
                    </button>
                    <button
                        onClick={() => onDeleteGroup(group)}
                        className="flex h-6 w-6 items-center justify-center rounded border  text-[var(--color-text-secondary)] transition hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                        title="Delete group"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>

                {/* Expand Arrow */}
                <button
                    onClick={() => onToggleExpand(group.id)}
                    className="flex-shrink-0 text-[var(--color-text-secondary)] transition"
                >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>

            {/* Expanded Locations Panel */}
            {isExpanded && (
                <div className="border-t  px-3.5 pb-3">
                    {/* Loc toolbar */}
                    <div className="flex items-center justify-between py-2.5">
                        <span className="text-xs text-[var(--color-text-secondary)]">
                            {group.locations.length} pin{group.locations.length !== 1 ? "s" : ""}
                        </span>
                        <div className="flex items-center gap-2">
                            {anyLocSelected && (
                                <button
                                    onClick={() => onDeleteSelectedLocs(group.id)}
                                    className="rounded-lg border border-destructive/30 bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive transition hover:bg-destructive/20"
                                >
                                    Delete selected pins
                                </button>
                            )}
                            <button
                                onClick={() => onSelectAllLocs(group.id, !allLocSelected)}
                                className="rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground transition hover:bg-secondary"
                            >
                                {allLocSelected ? "Deselect all" : "Select all"}
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {group.locations.length === 0 ? (
                            <p className="py-3 text-center text-xs text-[var(--color-text-secondary)]">No pins</p>
                        ) : (
                            group.locations.map((loc) => (
                                <LocationRow
                                    key={loc.id}
                                    loc={loc}
                                    groupId={group.id}
                                    checked={selectedLocIds.has(loc.id)}
                                    onToggle={(locId, checked) => onToggleLocSelect(group.id, locId, checked)}
                                    onDelete={(l) => onDeleteLocation(group.id, l)}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Hotspot Card ─────────────────────────────────────────────────────────────

interface HotspotCardProps {
    hotspot: Hotspot;
    isExpanded: boolean;
    selectedGroupIds: Set<string>;
    onToggleExpand: (id: string) => void;
    onToggleGroupSelect: (hotspotId: string, groupId: string, checked: boolean) => void;
    onToggleActive: (id: string) => void;
    onEdit: (hotspot: Hotspot) => void;
    onDeleteGroup: (hotspotId: string, groupId: string) => void;
    onBulkDeleteGroups: (hotspotId: string) => void;
    onDeleteHotspot: (hotspot: Hotspot) => void;
}

function HotspotCard({
    hotspot,
    isExpanded,
    selectedGroupIds,
    onToggleExpand,
    onToggleGroupSelect,
    onToggleActive,
    onEdit,
    onDeleteGroup,
    onBulkDeleteGroups,
    onDeleteHotspot,
}: HotspotCardProps) {
    const anySelected = hotspot.locationGroups.some((g) => selectedGroupIds.has(g.id));

    return (
        <div className="overflow-hidden rounded-xl border  ">
            {/* Header */}
            <div
                className="flex cursor-pointer items-center gap-2.5 px-3.5 py-3"
                onClick={() => onToggleExpand(hotspot.id)}
            >
                {/* Icon */}
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                    <Zap size={16} className="text-destructive" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                        {hotspot.locationGroups[0]?.title ?? "Untitled Hotspot"} &nbsp;
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                        Every {hotspot.dropEveryDays}d &nbsp;·&nbsp; {hotspot.pinDurationDays}d duration &nbsp;·&nbsp; Until{" "}
                        {fmtDate(hotspot.hotspotEndDate)} &nbsp;·&nbsp; {hotspot.locationGroups.length} drop
                        {hotspot.locationGroups.length !== 1 ? "s" : ""}
                    </div>
                </div>

                {/* Status & actions */}
                <div className="flex flex-shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span
                        className={`h-2 w-2 flex-shrink-0 rounded-full ${hotspot.isActive ? "bg-primary" : "bg-muted-foreground"}`}
                    />
                    <span className="text-xs text-[var(--color-text-secondary)]">
                        {hotspot.isActive ? "Active" : "Paused"}
                    </span>
                    <button
                        onClick={() => onToggleActive(hotspot.id)}
                        className="flex items-center gap-1 rounded-lg border border-[var(--color-border-secondary)] px-2.5 py-1 text-xs transition hover:bg-[var(--color-background-secondary)]"
                    >
                        {hotspot.isActive ? <Pause size={11} /> : <Play size={11} />}
                        {hotspot.isActive ? "Pause" : "Resume"}
                    </button>
                    <button
                        onClick={() => onEdit(hotspot)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border  text-[var(--color-text-secondary)] transition hover:bg-[var(--color-background-secondary)]"
                    >
                        <Pencil size={12} />
                    </button>
                    {/* <button
                        onClick={() => onDeleteHotspot(hotspot)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border  text-[var(--color-text-secondary)] transition hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                        title="Delete hotspot"
                    >
                        <Trash2 size={12} />
                    </button> */}
                </div>

                <button className="flex-shrink-0 text-[var(--color-text-secondary)]">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>

            {/* Drop groups */}
            {isExpanded && (
                <div className="border-t  px-3.5 pb-3">
                    <div className="flex items-center justify-between py-2.5">
                        <span className="text-xs text-[var(--color-text-secondary)]">
                            Drop groups ({hotspot.locationGroups.length})
                        </span>
                        {anySelected && (
                            <button
                                onClick={() => onBulkDeleteGroups(hotspot.id)}
                                className="rounded-lg border border-destructive/30 bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive transition hover:bg-destructive/20"
                            >
                                Delete selected drops
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        {hotspot.locationGroups.length === 0 ? (
                            <p className="py-3 text-center text-xs text-[var(--color-text-secondary)]">No drop groups yet</p>
                        ) : (
                            hotspot.locationGroups.map((g) => {
                                const status = getStatus(g.startDate, g.endDate);
                                const isTemplate = !g.hotspotId || g === hotspot.locationGroups[0];
                                const totalConsumers = g.locations.reduce((s, l) => s + l._count.consumers, 0);
                                return (
                                    <div
                                        key={g.id}
                                        className="flex items-center gap-2.5 rounded-lg border  bg-[var(--color-background-secondary)] px-3 py-2"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedGroupIds.has(g.id)}
                                            onChange={(e) => onToggleGroupSelect(hotspot.id, g.id, e.target.checked)}
                                            className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer accent-primary"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-medium">{g.title}</span>
                                                {isTemplate && (
                                                    <span className="rounded border border-destructive/20 bg-destructive/10 px-1.5 py-0.5 text-[10px] text-destructive">
                                                        Template
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-0.5 text-[11px] text-[var(--color-text-secondary)]">
                                                {fmtDate(g.startDate)} → {fmtDate(g.endDate)} &nbsp;·&nbsp; {g.locations.length} pins &nbsp;·&nbsp;{" "}
                                                {totalConsumers} collected
                                            </div>
                                        </div>
                                        <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusConfig[status].className}`}>
                                            {statusConfig[status].label}
                                        </span>
                                        <button
                                            onClick={() => onDeleteGroup(hotspot.id, g.id)}
                                            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border  text-[var(--color-text-secondary)] transition hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Summary Bar ──────────────────────────────────────────────────────────────

function SummaryBar({
    summary,
    activeTab,
    onTabChange,
}: {
    summary?: { general: number; landmark: number; event: number; hotspot: number };
    activeTab: Tab;
    onTabChange: (t: Tab) => void;
}) {
    const items: { key: Tab; label: string; icon: React.ElementType }[] = [
        { key: "general", label: "General", icon: Map },
        { key: "landmark", label: "Landmark", icon: Landmark },
        { key: "event", label: "Event", icon: Calendar },
        { key: "hotspot", label: "Hotspot", icon: Zap },
    ];

    return (
        <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {items.map(({ key, label, icon: Icon }) => (
                <button
                    key={key}
                    onClick={() => onTabChange(key)}
                    className={`rounded-xl border p-3 text-left transition ${activeTab === key
                        ? "border-border bg-secondary"
                        : "border-border bg-background hover:bg-secondary"
                        }`}
                >
                    <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon size={12} />
                        {label}
                    </div>
                    <div className="text-xl font-semibold">
                        {summary ? summary[key] : "—"}
                    </div>
                </button>
            ))}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PinManagementPage() {
    const [activeTab, setActiveTab] = useState<Tab>("general");
    const [search, setSearch] = useState("");
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
    // loc selections: groupId -> Set<locId>
    const [selectedLocs, setSelectedLocs] = useState<Record<string, Set<string>>>({});
    // hotspot drop group selections: hotspotId -> Set<groupId>
    const [selectedHotspotGroups, setSelectedHotspotGroups] = useState<Record<string, Set<string>>>({});

    // Confirm modal state
    const [confirmModal, setConfirmModal] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);

    // Edit modal state
    const [editingGroup, setEditingGroup] = useState<LocationGroup | null>(null);

    const utils = api.useUtils();

    // ── Queries ──
    const summaryQ = api.maps.pin.getSummary.useQuery();

    const groupsQ = api.maps.pin.getLocationGroups.useQuery(
        { type: activeTab as "general" | "landmark" | "event", search },
        { enabled: activeTab !== "hotspot" }
    );

    const hotspotsQ = api.maps.pin.getHotspots.useQuery(
        { search },
        { enabled: activeTab === "hotspot" }
    );

    // ── Mutations ──
    const deleteGroup = api.maps.pin.deleteLocationGroup.useMutation({
        onSuccess: () => { utils.maps.pin.getLocationGroups.invalidate(); utils.maps.pin.getSummary.invalidate(); },
    });

    const bulkDeleteGroups = api.maps.pin.bulkDeleteLocationGroups.useMutation({
        onSuccess: () => { utils.maps.pin.getLocationGroups.invalidate(); utils.maps.pin.getSummary.invalidate(); },
    });

    const deleteLocation = api.maps.pin.deleteLocation.useMutation({
        onSuccess: () => utils.maps.pin.getLocationGroups.invalidate(),
    });

    const bulkDeleteLocations = api.maps.pin.bulkDeleteLocations.useMutation({
        onSuccess: () => utils.maps.pin.getLocationGroups.invalidate(),
    });

    const toggleHotspot = api.maps.pin.toggleHotspotActive.useMutation({
        onSuccess: () => utils.maps.pin.getHotspots.invalidate(),
    });

    const deleteHotspotDrop = api.maps.pin.deleteHotspotDropGroup.useMutation({
        onSuccess: () => utils.maps.pin.getHotspots.invalidate(),
    });

    const bulkDeleteHotspotDrops = api.maps.pin.bulkDeleteHotspotDropGroups.useMutation({
        onSuccess: () => utils.maps.pin.getHotspots.invalidate(),
    });

    const deleteHotspot = api.maps.pin.deleteHotspotCascade.useMutation({
        onSuccess: () => utils.maps.pin.getHotspots.invalidate(),
    });

    const updateGroup = api.maps.pin.updateLocationGroup.useMutation({
        onSuccess: () => {
            utils.maps.pin.getLocationGroups.invalidate();
            setEditingGroup(null);
        },
    });

    // ── Handlers ──
    const toggleExpand = useCallback((id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const toggleGroupSelect = useCallback((id: string, checked: boolean) => {
        setSelectedGroups((prev) => {
            const next = new Set(prev);
            checked ? next.add(id) : next.delete(id);
            return next;
        });
    }, []);

    const toggleLocSelect = useCallback((groupId: string, locId: string, checked: boolean) => {
        setSelectedLocs((prev) => {
            const set = new Set(prev[groupId] ?? []);
            checked ? set.add(locId) : set.delete(locId);
            return { ...prev, [groupId]: set };
        });
    }, []);

    const selectAllLocs = useCallback((groupId: string, all: boolean) => {
        setSelectedLocs((prev) => {
            if (!all) return { ...prev, [groupId]: new Set() };
            const group = groupsQ.data?.groups.find((g) => g.id === groupId);
            const set = new Set((group?.locations ?? []).map((l) => l.id));
            return { ...prev, [groupId]: set };
        });
    }, [groupsQ.data]);

    const toggleHotspotGroupSelect = useCallback((hotspotId: string, groupId: string, checked: boolean) => {
        setSelectedHotspotGroups((prev) => {
            const set = new Set(prev[hotspotId] ?? []);
            checked ? set.add(groupId) : set.delete(groupId);
            return { ...prev, [hotspotId]: set };
        });
    }, []);

    // ── Delete actions ──
    function handleDeleteGroup(group: LocationGroup) {
        setConfirmModal({
            title: "Delete group",
            message: `Delete "${group.title}" and all its pins? This cannot be undone.`,
            onConfirm: () => {
                deleteGroup.mutate({ id: group.id });
                setConfirmModal(null);
            },
        });
    }

    function handleBulkDeleteGroups() {
        const ids = [...selectedGroups];
        setConfirmModal({
            title: "Delete selected groups",
            message: `Delete ${ids.length} group${ids.length !== 1 ? "s" : ""}? This cannot be undone.`,
            onConfirm: () => {
                bulkDeleteGroups.mutate({ ids });
                setSelectedGroups(new Set());
                setConfirmModal(null);
            },
        });
    }

    function handleDeleteLocation(groupId: string, loc: Location) {
        setConfirmModal({
            title: "Delete pin",
            message: `Delete pin at ${fmtCoords(loc.latitude, loc.longitude)}?`,
            onConfirm: () => {
                deleteLocation.mutate({ locationId: loc.id, locationGroupId: groupId });
                setConfirmModal(null);
            },
        });
    }

    function handleDeleteSelectedLocs(groupId: string) {
        const ids = [...(selectedLocs[groupId] ?? [])];
        if (!ids.length) return;
        setConfirmModal({
            title: "Delete selected pins",
            message: `Delete ${ids.length} pin${ids.length !== 1 ? "s" : ""}?`,
            onConfirm: () => {
                bulkDeleteLocations.mutate({ locationIds: ids, locationGroupId: groupId });
                setSelectedLocs((prev) => ({ ...prev, [groupId]: new Set() }));
                setConfirmModal(null);
            },
        });
    }

    function handleDeleteHotspotDrop(hotspotId: string, groupId: string) {
        setConfirmModal({
            title: "Delete drop group",
            message: "Delete this drop group? This cannot be undone.",
            onConfirm: () => {
                deleteHotspotDrop.mutate({ locationGroupId: groupId, hotspotId });
                setConfirmModal(null);
            },
        });
    }

    function handleBulkDeleteHotspotDrops(hotspotId: string) {
        const ids = [...(selectedHotspotGroups[hotspotId] ?? [])];
        if (!ids.length) return;
        setConfirmModal({
            title: "Delete selected drops",
            message: `Delete ${ids.length} drop group${ids.length !== 1 ? "s" : ""}?`,
            onConfirm: () => {
                bulkDeleteHotspotDrops.mutate({ locationGroupIds: ids, hotspotId });
                setSelectedHotspotGroups((prev) => ({ ...prev, [hotspotId]: new Set() }));
                setConfirmModal(null);
            },
        });
    }

    function handleDeleteHotspot(hotspot: Hotspot) {
        setConfirmModal({
            title: "Delete hotspot",
            message: `Delete hotspot and all ${hotspot.locationGroups.length} drop group(s)? This cannot be undone.`,
            onConfirm: () => {
                deleteHotspot.mutate({ hotspotId: hotspot.id });
                setConfirmModal(null);
            },
        });
    }

    function handleEditGroup(group: LocationGroup) {
        setEditingGroup(group);
    }

    function handleSaveEditGroup(data: {
        title?: string;
        description?: string;
        startDate?: Date;
        endDate?: Date;
        image?: string;
        link?: string;
    }) {
        if (!editingGroup) return;
        updateGroup.mutate({
            id: editingGroup.id,
            ...data,
        });
    }

    const groups = groupsQ.data?.groups ?? [];
    const hotspots = hotspotsQ.data?.hotspots ?? [];
    const selectedGroupCount = selectedGroups.size;
    const isLoading = activeTab === "hotspot" ? hotspotsQ.isLoading : groupsQ.isLoading;

    // Tab labels
    const tabDefs: { key: Tab; label: string }[] = [
        { key: "general", label: "General" },
        { key: "landmark", label: "Landmark" },
        { key: "event", label: "Event" },
        { key: "hotspot", label: "Hotspot" },
    ];

    return (
        <div className="w-full p-6 space-y-6 overflow-y-auto">
            {/* Header */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-lg font-medium">Pin management</h1>
                {/* Tabs */}
                <div className="flex gap-1 rounded-xl border  bg-[var(--color-background-secondary)] p-[3px]">
                    {tabDefs.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => { setActiveTab(key); setSelectedGroups(new Set()); }}
                            className={`rounded-lg px-3.5 py-1.5 text-[13px] transition ${activeTab === key
                                ? "border  bg-primary text-primary-foreground  font-medium"
                                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary bar */}
            <SummaryBar
                summary={summaryQ.data}
                activeTab={activeTab}
                onTabChange={(t) => { setActiveTab(t); setSelectedGroups(new Set()); }}
            />

            {/* Toolbar */}
            <div className="relative mb-3 flex flex-wrap items-center gap-2">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search groups…"
                    className="min-w-[180px] flex-1 rounded-xl border   px-3 py-1.5 text-sm outline-none transition focus:border-[var(--color-border-secondary)]"
                />
                {selectedGroupCount > 0 && (
                    <span className="px-1 text-xs text-[var(--color-text-secondary)]">
                        {selectedGroupCount} selected
                    </span>
                )}
                <button
                    disabled={selectedGroupCount === 0}
                    onClick={handleBulkDeleteGroups}
                    className="rounded-xl border border-destructive/30 px-3 py-1.5 text-sm font-medium text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {activeTab === "hotspot" ? "Delete selected drops" : "Delete selected"}
                </button>
            </div>

            {/* Content */}
            <div className="relative flex  flex-col gap-2.5">
                {isLoading ? (
                    <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">
                        Loading…
                    </div>
                ) : activeTab === "hotspot" ? (
                    hotspots.length === 0 ? (
                        <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">
                            No hotspots found
                        </div>
                    ) : (
                        hotspots.map((h) => (
                            <HotspotCard
                                key={h.id}
                                hotspot={h as Hotspot}
                                isExpanded={expandedIds.has(h.id)}
                                selectedGroupIds={selectedHotspotGroups[h.id] ?? new Set()}
                                onToggleExpand={toggleExpand}
                                onToggleGroupSelect={toggleHotspotGroupSelect}
                                onToggleActive={(id) => toggleHotspot.mutate({ id })}
                                onEdit={(hs) => {
                                    // Route to edit hotspot – adjust to your routing solution
                                    console.log("edit hotspot", hs.id);
                                }}
                                onDeleteGroup={handleDeleteHotspotDrop}
                                onBulkDeleteGroups={handleBulkDeleteHotspotDrops}
                                onDeleteHotspot={handleDeleteHotspot}
                            />
                        ))
                    )
                ) : groups.length === 0 ? (
                    <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">
                        No {activeTab} groups found
                    </div>
                ) : (
                    groups.map((g) => (
                        <GroupCard
                            key={g.id}
                            group={g as LocationGroup}
                            tab={activeTab}
                            isExpanded={expandedIds.has(g.id)}
                            isSelected={selectedGroups.has(g.id)}
                            selectedLocIds={selectedLocs[g.id] ?? new Set()}
                            onToggleExpand={toggleExpand}
                            onToggleSelect={toggleGroupSelect}
                            onToggleLocSelect={toggleLocSelect}
                            onEdit={(group) => {
                                handleEditGroup(group);
                            }}
                            onDeleteGroup={handleDeleteGroup}
                            onDeleteLocation={handleDeleteLocation}
                            onDeleteSelectedLocs={handleDeleteSelectedLocs}
                            onSelectAllLocs={selectAllLocs}
                        />
                    ))
                )}

                {/* Confirm Modal */}
                {confirmModal && (
                    <ConfirmModal
                        title={confirmModal.title}
                        message={confirmModal.message}
                        onConfirm={confirmModal.onConfirm}
                        onCancel={() => setConfirmModal(null)}
                        loading={
                            deleteGroup.isLoading ||
                            bulkDeleteGroups.isLoading ||
                            deleteLocation.isLoading ||
                            bulkDeleteLocations.isLoading ||
                            deleteHotspotDrop.isLoading ||
                            bulkDeleteHotspotDrops.isLoading ||
                            deleteHotspot.isLoading
                        }
                    />
                )}

                {/* Edit Group Modal */}
                {editingGroup && (
                    <EditGroupModal
                        group={editingGroup}
                        onSave={handleSaveEditGroup}
                        onCancel={() => setEditingGroup(null)}
                        loading={updateGroup.isLoading}
                    />
                )}
            </div>
        </div>
    );
}
