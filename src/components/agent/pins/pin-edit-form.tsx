"use client";

import { useState } from "react";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "~/components/shadcn/ui/button";
import { Input } from "~/components/shadcn/ui/input";
import { Textarea } from "~/components/shadcn/ui/textarea";
import { Switch } from "~/components/shadcn/ui/switch";
import { Label } from "~/components/shadcn/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/shadcn/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/shadcn/ui/popover";
import { Calendar } from "~/components/shadcn/ui/calendar";
import { cn, fmt } from "~/lib/utils";


// ─── Types ────────────────────────────────────────────────────────────────────

export interface PinLocation {
    id: string;
    latitude: number;
    longitude: number;
    autoCollect: boolean;
    hidden: boolean;
}

export interface PinEditFields {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    image?: string;
    link?: string;
    multiPin?: boolean;
    hidden?: boolean;
}

export interface LocationEditFields {
    latitude?: number;
    longitude?: number;
    autoCollect?: boolean;
    hidden?: boolean;
}

export type HotspotScope = "this" | "future" | "all";

export interface PinData {
    id: string;
    title: string;
    description?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    radius?: number | null;
    image?: string | null;
    link?: string | null;
    multiPin?: boolean | null;
    hidden?: boolean | null;
    hotspotId?: string | null;
    locations?: PinLocation[] | null;
}

interface PinEditFormProps {
    pin: PinData;
    onSubmit: (fields: PinEditFields, scope: HotspotScope, locationEdits: Record<string, LocationEditFields>) => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

// ─── DatePickerField ──────────────────────────────────────────────────────────

function DatePickerField({ label, value, onChange }: {
    label: string;
    value: string | undefined;
    onChange: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const date = value ? new Date(value) : undefined;

    return (
        <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground font-medium">{label}</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left text-xs font-normal h-9",
                            !date && "text-muted-foreground"
                        )}
                    >
                        {date ? fmt(date.toISOString()) : "Pick a date"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => { if (d) { onChange(d.toISOString()); setOpen(false); } }}
                        initialFocus
                        today={undefined}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

// ─── ToggleRow ────────────────────────────────────────────────────────────────

function ToggleRow({ id, label, description, checked, onCheckedChange, activeColor = "border-primary/40 bg-primary/5" }: {
    id: string;
    label: string;
    description: string;
    checked: boolean;
    onCheckedChange: (v: boolean) => void;
    activeColor?: string;
}) {
    return (
        <div className={cn(
            "flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors",
            checked ? activeColor : "border-border bg-muted/30"
        )}>
            <div className="flex flex-col gap-0.5">
                <Label htmlFor={id} className="text-[12px] font-medium text-foreground cursor-pointer">
                    {label}
                </Label>
                <p className="text-[11px] text-muted-foreground">{description}</p>
            </div>
            <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
        </div>
    );
}

// ─── PinEditForm ──────────────────────────────────────────────────────────────

export function PinEditForm({ pin, onSubmit, onCancel, isSubmitting }: PinEditFormProps) {
    const isHotspotLinked = !!pin.hotspotId;

    const [title, setTitle] = useState(pin.title ?? "");
    const [description, setDescription] = useState(pin.description ?? "");
    const [startDate, setStartDate] = useState<string | undefined>(pin.startDate ?? undefined);
    const [endDate, setEndDate] = useState<string | undefined>(pin.endDate ?? undefined);
    const [latitude, setLatitude] = useState(pin.latitude?.toString() ?? "");
    const [longitude, setLongitude] = useState(pin.longitude?.toString() ?? "");
    const [radius, setRadius] = useState(pin.radius?.toString() ?? "");
    const [image, setImage] = useState(pin.image ?? "");
    const [link, setLink] = useState(pin.link ?? "");
    const [multiPin, setMultiPin] = useState(pin.multiPin ?? false);
    const [hidden, setHidden] = useState(pin.hidden ?? false);
    const [scope, setScope] = useState<HotspotScope>("this");

    const [locationsExpanded, setLocationsExpanded] = useState(false);
    const [locationEdits, setLocationEdits] = useState<Record<string, LocationEditFields>>({});

    const hasLocations = (pin.locations?.length ?? 0) > 0;

    const updateLocationField = (locId: string, field: keyof LocationEditFields, value: unknown) => {
        setLocationEdits(prev => ({
            ...prev,
            [locId]: { ...prev[locId], [field]: value },
        }));
    };

    const handleSubmit = () => {
        const fields: PinEditFields = {};
        if (title !== pin.title) fields.title = title;
        if (description !== (pin.description ?? "")) fields.description = description;
        if (startDate !== (pin.startDate ?? undefined)) fields.startDate = startDate;
        if (endDate !== (pin.endDate ?? undefined)) fields.endDate = endDate;
        if (latitude && parseFloat(latitude) !== pin.latitude) fields.latitude = parseFloat(latitude);
        if (longitude && parseFloat(longitude) !== pin.longitude) fields.longitude = parseFloat(longitude);
        if (radius && parseFloat(radius) !== pin.radius) fields.radius = parseFloat(radius);
        if (image !== (pin.image ?? "")) fields.image = image;
        if (link !== (pin.link ?? "")) fields.link = link;
        if (multiPin !== pin.multiPin) fields.multiPin = multiPin;
        if (hidden !== pin.hidden) fields.hidden = hidden;
        onSubmit(fields, scope, locationEdits);
    };

    return (
        <div className="flex flex-col gap-4">

            {/* Hotspot scope banner */}
            {isHotspotLinked && (
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-3 flex flex-col gap-2">
                    <p className="text-[11px] font-semibold text-blue-400">
                        This pin is hotspot-linked. Apply changes to:
                    </p>
                    <RadioGroup
                        value={scope}
                        onValueChange={(v) => setScope(v as HotspotScope)}
                        className="flex flex-col gap-1.5"
                    >
                        {[
                            { value: "this", label: "This drop only" },
                            { value: "future", label: "All future drops" },
                            { value: "all", label: "All drops (this + future)" },
                        ].map((opt) => (
                            <Label
                                key={opt.value}
                                htmlFor={`scope-${opt.value}`}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-all",
                                    scope === opt.value
                                        ? "border-blue-500/50 bg-blue-500/10"
                                        : "border-border bg-muted/30 hover:bg-muted/50"
                                )}
                            >
                                <RadioGroupItem id={`scope-${opt.value}`} value={opt.value} />
                                <span className={cn(
                                    "text-[12px] font-medium",
                                    scope === opt.value ? "text-blue-400" : "text-foreground"
                                )}>
                                    {opt.label}
                                </span>
                            </Label>
                        ))}
                    </RadioGroup>
                </div>
            )}

            {/* Title */}
            <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-medium">Title</Label>
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-9 text-sm"
                    placeholder="Pin title"
                />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-medium">Description</Label>
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="text-sm min-h-[72px] resize-none"
                    placeholder="Pin description"
                />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
                <DatePickerField label="Start Date" value={startDate} onChange={setStartDate} />
                <DatePickerField label="End Date" value={endDate} onChange={setEndDate} />
            </div>

            {/* Coordinates — show inputs only when no sub-locations */}
            {!hasLocations ? (
                <>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[11px] text-muted-foreground font-medium">Latitude</Label>
                            <Input
                                type="number"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                className="h-9 text-sm font-mono"
                                placeholder="23.8103"
                                step="0.00001"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[11px] text-muted-foreground font-medium">Longitude</Label>
                            <Input
                                type="number"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                className="h-9 text-sm font-mono"
                                placeholder="90.4125"
                                step="0.00001"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-muted-foreground font-medium">Radius (meters)</Label>
                        <Input
                            type="number"
                            value={radius}
                            onChange={(e) => setRadius(e.target.value)}
                            className="h-9 text-sm font-mono"
                            placeholder="500"
                            step={10}
                        />
                    </div>
                </>
            ) : (
                <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                    <p className="text-[11px] font-semibold text-muted-foreground mb-1">📍 Center Point</p>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: "Latitude", value: latitude || "—" },
                            { label: "Longitude", value: longitude || "—" },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex flex-col gap-1">
                                <Label className="text-[10px] text-muted-foreground">{label}</Label>
                                <div className="h-9 flex items-center rounded border border-border bg-background px-3 font-mono text-xs text-foreground">
                                    {value}
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground italic mt-1.5">
                        Edit individual location coordinates below
                    </p>
                </div>
            )}

            {/* Image & Link */}
            <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-medium">Image URL</Label>
                <Input
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="h-9 text-sm"
                    placeholder="https://..."
                />
            </div>
            <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-medium">Link</Label>
                <Input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="h-9 text-sm"
                    placeholder="https://..."
                />
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-2">
                <ToggleRow
                    id="multiPin-toggle"
                    label="Multi Pin"
                    description="Allow multiple collections"
                    checked={multiPin}
                    onCheckedChange={setMultiPin}
                />
                <ToggleRow
                    id="hidden-toggle"
                    label="Hide Pin"
                    description="Hide from the map"
                    checked={hidden}
                    onCheckedChange={setHidden}
                    activeColor="border-red-500/40 bg-red-500/5"
                />
            </div>

            {/* Sub-locations */}
            {hasLocations && (
                <div className="flex flex-col gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocationsExpanded(!locationsExpanded)}
                        className="w-full flex items-center justify-between text-xs font-semibold"
                    >
                        <span>📍 Expand Locations ({pin.locations!.length})</span>
                        {locationsExpanded
                            ? <ChevronUp className="w-4 h-4" />
                            : <ChevronDown className="w-4 h-4" />
                        }
                    </Button>

                    {locationsExpanded && (
                        <div className="flex flex-col gap-3 pl-1 border-l-2 border-primary/20 ml-1">
                            {pin.locations!.map((loc, i) => {
                                const edits = locationEdits[loc.id] ?? {};
                                const lat = edits.latitude?.toString() ?? loc.latitude.toString();
                                const lng = edits.longitude?.toString() ?? loc.longitude.toString();
                                const autoCollect = edits.autoCollect ?? loc.autoCollect;
                                const locHidden = edits.hidden ?? loc.hidden;

                                return (
                                    <div key={loc.id} className="flex flex-col gap-2.5 rounded-xl border border-border bg-muted/20 p-3">
                                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Location {i + 1}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex flex-col gap-1">
                                                <Label className="text-[10px] text-muted-foreground">Latitude</Label>
                                                <Input
                                                    type="number"
                                                    value={lat}
                                                    step="0.00001"
                                                    onChange={(e) => updateLocationField(loc.id, "latitude", parseFloat(e.target.value))}
                                                    className="h-8 text-xs font-mono"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label className="text-[10px] text-muted-foreground">Longitude</Label>
                                                <Input
                                                    type="number"
                                                    value={lng}
                                                    step="0.00001"
                                                    onChange={(e) => updateLocationField(loc.id, "longitude", parseFloat(e.target.value))}
                                                    className="h-8 text-xs font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "flex items-center justify-between flex-1 px-2.5 py-2 rounded-lg border transition-colors",
                                                autoCollect ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30"
                                            )}>
                                                <Label htmlFor={`auto-${loc.id}`} className="text-[11px] font-medium text-foreground cursor-pointer">
                                                    Auto Collect
                                                </Label>
                                                <Switch
                                                    id={`auto-${loc.id}`}
                                                    checked={autoCollect}
                                                    onCheckedChange={(v) => updateLocationField(loc.id, "autoCollect", v)}
                                                />
                                            </div>
                                            <div className={cn(
                                                "flex items-center justify-between flex-1 px-2.5 py-2 rounded-lg border transition-colors",
                                                locHidden ? "border-red-500/40 bg-red-500/5" : "border-border bg-muted/30"
                                            )}>
                                                <Label htmlFor={`lhidden-${loc.id}`} className="text-[11px] font-medium text-foreground cursor-pointer">
                                                    Hidden
                                                </Label>
                                                <Switch
                                                    id={`lhidden-${loc.id}`}
                                                    checked={locHidden}
                                                    onCheckedChange={(v) => updateLocationField(loc.id, "hidden", v)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1 sticky bottom-0 bg-background pb-1">
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 h-10 text-sm font-bold"
                >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Update
                </Button>
                <Button
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="px-5 h-10 text-sm"
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}