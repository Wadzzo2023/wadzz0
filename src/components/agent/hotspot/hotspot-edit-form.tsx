"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "~/components/shadcn/ui/button";
import { Input } from "~/components/shadcn/ui/input";
import { Switch } from "~/components/shadcn/ui/switch";
import { Label } from "~/components/shadcn/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/shadcn/ui/popover";
import { Calendar } from "~/components/shadcn/ui/calendar";
import { cn, fmt } from "~/lib/utils";


// ─── Types ────────────────────────────────────────────────────────────────────

export interface HotspotEditFields {
    autoCollect?: boolean;
    multiPin?: boolean;
    dropEveryDays?: number;
    pinDurationDays?: number;
    hotspotStartDate?: string;
    hotspotEndDate?: string;
    isActive?: boolean;
}

export interface HotspotData {
    id: string;
    displayName: string;
    isActive: boolean;
    dropEveryDays?: number | null;
    dropCount?: number;
}

interface HotspotEditFormProps {
    hotspot: HotspotData;
    onSubmit: (hotspotId: string, fields: HotspotEditFields) => void;
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

// ─── HotspotEditForm ──────────────────────────────────────────────────────────

export function HotspotEditForm({ hotspot, onSubmit, onCancel, isSubmitting }: HotspotEditFormProps) {
    const [autoCollect, setAutoCollect] = useState(false);
    const [multiPin, setMultiPin] = useState(false);
    const [dropEveryDays, setDropEveryDays] = useState(hotspot.dropEveryDays?.toString() ?? "");
    const [pinDurationDays, setPinDurationDays] = useState("");
    const [startDate, setStartDate] = useState<string | undefined>(undefined);
    const [endDate, setEndDate] = useState<string | undefined>(undefined);
    const [isActive, setIsActive] = useState(hotspot.isActive);

    const handleSubmit = () => {
        const fields: HotspotEditFields = {};
        fields.autoCollect = autoCollect;
        fields.multiPin = multiPin;
        fields.isActive = isActive;
        if (dropEveryDays) fields.dropEveryDays = parseInt(dropEveryDays, 10);
        if (pinDurationDays) fields.pinDurationDays = parseInt(pinDurationDays, 10);
        if (startDate) fields.hotspotStartDate = startDate;
        if (endDate) fields.hotspotEndDate = endDate;
        onSubmit(hotspot.id, fields);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2">
                <p className="text-[11px] font-semibold text-blue-400">
                    🔁 Editing hotspot: {hotspot.displayName}
                </p>
                <p className="text-[10px] text-blue-400/70 mt-0.5">
                    Changes cascade to all linked drops where specified.
                </p>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-muted-foreground font-medium">Drop Every (days)</Label>
                    <Input
                        type="number"
                        value={dropEveryDays}
                        onChange={(e) => setDropEveryDays(e.target.value)}
                        className="h-9 text-sm font-mono"
                        placeholder="7"
                        min={1}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-muted-foreground font-medium">Pin Duration (days)</Label>
                    <Input
                        type="number"
                        value={pinDurationDays}
                        onChange={(e) => setPinDurationDays(e.target.value)}
                        className="h-9 text-sm font-mono"
                        placeholder="30"
                        min={1}
                    />
                </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
                <DatePickerField label="Hotspot Start" value={startDate} onChange={setStartDate} />
                <DatePickerField label="Hotspot End" value={endDate} onChange={setEndDate} />
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-2">
                <ToggleRow
                    id="hs-autocollect"
                    label="Auto Collect"
                    description="Cascades to all locations"
                    checked={autoCollect}
                    onCheckedChange={setAutoCollect}
                />
                <ToggleRow
                    id="hs-multipin"
                    label="Multi Pin"
                    description="Cascades to all drops"
                    checked={multiPin}
                    onCheckedChange={setMultiPin}
                />
                <ToggleRow
                    id="hs-active"
                    label="Active Scheduler"
                    description="Controls future drop scheduling"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    activeColor="border-emerald-500/40 bg-emerald-500/5"
                />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 h-10 text-sm font-bold">
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Update Hotspot
                </Button>
                <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="px-5 h-10 text-sm">
                    Cancel
                </Button>
            </div>
        </div>
    );
}