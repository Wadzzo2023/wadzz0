"use client"


import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { getCookie } from "cookies-next"
import { api } from "~/utils/api"
import {
    Send,
    Loader2,
    MapPin,
    Calendar,
    ChevronDown,
    Minus,
    Trash2,
    Check,
    CheckCircle2,
    Sparkles,
    X,
    XCircle,
    ChevronUp,
} from "lucide-react"
import type { AgentState, AgentTask, EventData, LandmarkData, Message, PinItem } from "~/lib/agent/types"
import { Input } from "../shadcn/ui/input"
// ─── Types ────────────────────────────────────────────────────────────────────

type JobStatus = "pending" | "processing" | "completed" | "failed"

interface LogEntry {
    title: string
    status: "ok" | "error"
    error?: string
}

interface PinJobProgressProps {
    count: number
    jobId?: string
    onNew: (t: AgentTask) => void
}

// ─── Sub-component: status icon ───────────────────────────────────────────────

function StatusIcon({ status }: { status: JobStatus }) {
    if (status === "completed")
        return <CheckCircle2 className="h-8 w-8 text-emerald-500" />
    if (status === "failed")
        return <XCircle className="h-8 w-8 text-red-500" />
    return <Loader2 className="h-8 w-8 animate-spin text-primary" />
}
// ─── Local types ──────────────────────────────────────────────────────────────

type DateMap = Record<string, { startDate: string; endDate: string }>

type PinCfg = {
    pinNumber: number
    pinCollectionLimit: number
    autoCollect: boolean
    radius: number
}

type DatePickerItem = {
    id: string
    title: string
    defaultStart: string
    defaultEnd: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_STATE: AgentState = { step: "idle", task: null }

const WELCOME: Message = {
    role: "assistant",
    content:
        "Hi! I'm your Wadzzo assistant. I can help you create location pins for real events or landmarks. What would you like to do today?",

    uiData: {
        type: "task_select",
        data: {},
    },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

function toDateInput(iso: string) {
    return iso.split("T")[0] ?? ""
}

function fromDateInput(d: string) {
    return new Date(d + "T00:00:00").toISOString()
}

// ─── TaskSelect ───────────────────────────────────────────────────────────────

function TaskSelect({ onChoose }: { onChoose: (t: AgentTask) => void }) {
    const options: { type: AgentTask; icon: string; label: string; sub: string }[] = [
        {
            type: "event",
            icon: "📅",
            label: "Event Pins",
            sub: "Real upcoming events in your area",
        },
        {
            type: "landmark",
            icon: "📍",
            label: "Landmark Pins",
            sub: "Restaurants, shops, parks & more",
        },
    ]

    return (
        <div className="mt-3 grid grid-cols-2 gap-3">
            {options.map((opt) => (
                <button
                    key={String(opt.type)}
                    onClick={() => onChoose(opt.type)}
                    className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/40 p-4 text-left transition-all hover:border-primary hover:bg-primary/5 active:scale-95"
                >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="font-bold text-sm text-foreground">{opt.label}</span>
                    <span className="text-xs leading-relaxed text-muted-foreground">{opt.sub}</span>
                </button>
            ))}
        </div>
    )
}

// ─── EventList ────────────────────────────────────────────────────────────────

function EventList({
    events,
    selected,
    onToggle,
    onConfirm,
}: {
    events: EventData[]
    selected: EventData[]
    onToggle: (e: EventData) => void
    onConfirm: () => void
}) {
    const selIds = new Set(selected.map((e) => e.id))

    return (
        <div className="mt-3 flex flex-col gap-2">
            {events.map((ev, i) => {
                const isSel = selIds.has(ev.id)
                return (
                    <div
                        key={ev.id}
                        onClick={() => onToggle(ev)}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${isSel ? "border-primary bg-primary/5" : "border-border bg-muted/20 opacity-50"
                            }`}
                    >
                        <div
                            className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${isSel ? "border-primary bg-primary" : "border-border"
                                }`}
                        >
                            {isSel ? (
                                <Check className="h-3 w-3 text-primary-foreground" />
                            ) : (
                                <span className="text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="font-semibold text-sm text-foreground">{ev.title}</span>
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{ev.description}</p>
                            <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {fmtDate(ev.startDate)} – {fmtDate(ev.endDate)}
                                </span>
                                {ev.venue && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {ev.venue}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}

            <p className="text-center text-[11px] text-muted-foreground">
                {selected.length}/{events.length} selected · tap to toggle
            </p>
            <button
                onClick={onConfirm}
                disabled={selected.length === 0}
                className="mt-1 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
            >
                Confirm {selected.length} Event{selected.length !== 1 ? "s" : ""} →
            </button>
        </div>
    )
}

// ─── LandmarkList ─────────────────────────────────────────────────────────────

function LandmarkList({
    landmarks,
    selected,
    onToggle,
    onConfirm,
}: {
    landmarks: LandmarkData[]
    selected: LandmarkData[]
    onToggle: (l: LandmarkData) => void
    onConfirm: () => void
}) {
    const selIds = new Set(selected.map((l) => l.id))

    return (
        <div className="mt-3 flex flex-col gap-2">
            {landmarks.map((lm, i) => {
                const isSel = selIds.has(lm.id)
                return (
                    <div
                        key={lm.id}
                        onClick={() => onToggle(lm)}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${isSel ? "border-primary bg-primary/5" : "border-border bg-muted/20 opacity-50"
                            }`}
                    >
                        <div
                            className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${isSel ? "border-primary bg-primary" : "border-border"
                                }`}
                        >
                            {isSel ? (
                                <Check className="h-3 w-3 text-primary-foreground" />
                            ) : (
                                <span className="text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                                <span className="font-semibold text-sm text-foreground">{lm.title}</span>
                                {lm.category && (
                                    <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                                        {lm.category}
                                    </span>
                                )}
                            </div>
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{lm.description}</p>
                            {lm.address && (
                                <span className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {lm.address}
                                </span>
                            )}
                        </div>
                    </div>
                )
            })}

            <p className="text-center text-[11px] text-muted-foreground">
                {selected.length}/{landmarks.length} selected · tap to toggle
            </p>
            <button
                onClick={onConfirm}
                disabled={selected.length === 0}
                className="mt-1 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
            >
                Confirm {selected.length} Landmark{selected.length !== 1 ? "s" : ""} →
            </button>
        </div>
    )
}

// ─── DatePicker ───────────────────────────────────────────────────────────────

function DatePicker({
    items,
    onConfirm,
}: {
    items: DatePickerItem[]
    onConfirm: (dates: DateMap) => void
}) {
    const [dates, setDates] = useState<DateMap>(() =>
        Object.fromEntries(
            items.map((it) => [
                it.id,
                {
                    startDate: toDateInput(it.defaultStart),
                    endDate: toDateInput(it.defaultEnd),
                },
            ]),
        ),
    )

    function update(id: string, field: "startDate" | "endDate", value: string) {
        setDates((prev) => ({ ...prev, [id]: { ...prev[id]!, [field]: value } }))
    }

    return (
        <div className="mt-3 flex flex-col gap-3">
            {items.map((it) => (
                <div key={it.id} className="rounded-xl border border-border bg-muted/30 p-3">
                    <p className="mb-2 font-semibold text-sm text-foreground">{it.title}</p>
                    <div className="grid grid-cols-2 gap-2">
                        {(["startDate", "endDate"] as const).map((field) => (
                            <div key={field}>
                                <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
                                    {field === "startDate" ? "Start" : "End"}
                                </label>
                                <input
                                    type="date"
                                    value={dates[it.id]?.[field] ?? ""}
                                    onChange={(e) => update(it.id, field, e.target.value)}
                                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <button
                onClick={() => onConfirm(dates)}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
            >
                Confirm Dates →
            </button>
        </div>
    )
}

// ─── PinConfigForm ────────────────────────────────────────────────────────────

function PinConfigForm({
    items,
    isLandmark,
    onConfirm,
}: {
    items: Array<{ id: string; title: string; latitude: number; longitude: number }>
    isLandmark: boolean
    onConfirm: (cfgs: Record<string, PinCfg>) => void
}) {
    const [cfgs, setCfgs] = useState<Record<string, PinCfg>>(() =>
        Object.fromEntries(
            items.map((it) => [
                it.id,
                {
                    pinNumber: isLandmark ? 1 : 5,
                    pinCollectionLimit: isLandmark ? 999999 : 100,
                    autoCollect: false,
                    radius: 2,
                },
            ]),
        ),
    )
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [showBulkActions, setShowBulkActions] = useState(false)

    function updateCfg(id: string, updates: Partial<PinCfg>) {
        setCfgs((prev) => ({
            ...prev,
            [id]: { ...prev[id]!, ...updates },
        }))
    }

    function toggle(id: string) {
        updateCfg(id, { autoCollect: !cfgs[id]!.autoCollect })
    }

    function bulkToggleAutoCollect(enabled: boolean) {
        setCfgs((prev) =>
            Object.fromEntries(
                Object.entries(prev).map(([id, cfg]) => [id, { ...cfg, autoCollect: enabled }])
            )
        )
    }

    function bulkSetRadius(radius: number) {
        setCfgs((prev) =>
            Object.fromEntries(
                Object.entries(prev).map(([id, cfg]) => [id, { ...cfg, radius }])
            )
        )
    }

    return (
        <div className="mt-3 flex flex-col gap-3">


            {items.map((it) => {
                const cfg = cfgs[it.id]!
                const on = cfg.autoCollect
                const isExpanded = expandedId === it.id

                return (
                    <div
                        key={it.id}
                        className="rounded-[20px] bg-muted/50 p-4 transition-all"
                    >
                        {/* Header - clickable to expand */}
                        <button
                            onClick={() => setExpandedId(isExpanded ? null : it.id)}
                            className="w-full text-left transition-all hover:opacity-80"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">{it.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Pins: {cfg.pinNumber} | Limit: {cfg.pinCollectionLimit} | Radius: {cfg.radius}m | Auto: {on ? "Yes" : "No"}
                                    </p>
                                </div>
                                <span className="text-lg">{isExpanded ? "▼" : "▶"}</span>
                            </div>
                        </button>

                        {/* Expanded Editor */}
                        {isExpanded && (
                            <>
                                <div className="h-px bg-border mb-3" />
                                <div className="flex flex-col gap-3">
                                    {/* Location info */}
                                    <div className="flex gap-5 text-xs">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium uppercase tracking-wide text-muted-foreground">
                                                Latitude
                                            </span>
                                            <span className="font-mono text-foreground">
                                                {it.latitude.toFixed(4)}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium uppercase tracking-wide text-muted-foreground">
                                                Longitude
                                            </span>
                                            <span className="font-mono text-foreground">
                                                {it.longitude.toFixed(4)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Pin Number */}
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground">Number of Pins</label>
                                        <Input
                                            disabled
                                            type="number"
                                            min="1"
                                            value={cfg.pinNumber}

                                        />
                                    </div>

                                    {/* Collection Limit */}
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground">Collection Limit</label>
                                        <Input
                                            disabled
                                            type="number"
                                            min="1"

                                            value={cfg.pinCollectionLimit}

                                        />
                                    </div>

                                    {/* Radius */}
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground">Radius (meters)</label>
                                        <Input
                                            type="number"
                                            min="1"
                                            disabled
                                            value={cfg.radius}

                                        />
                                    </div>

                                    {/* Auto Collect Toggle */}
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id={`auto-collect-${it.id}`}
                                            checked={on}
                                            onChange={() => toggle(it.id)}
                                            className="h-4 w-4 rounded border-border accent-primary"
                                        />
                                        <label htmlFor={`auto-collect-${it.id}`} className="text-xs font-semibold text-muted-foreground cursor-pointer">
                                            Enable Auto Collect
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )
            })}
            {/* Bulk Actions */}
            {showBulkActions && (
                <div className="rounded-xl border border-border bg-muted/50 p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-foreground">Bulk Edit All</h4>
                        <button
                            onClick={() => setShowBulkActions(false)}
                            className="text-muted-foreground hover:text-foreground text-lg"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Set Radius (m) for All</label>
                            <div className="mt-1 flex gap-1">
                                {[1, 2, 5, 10, 50].map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => {
                                            bulkSetRadius(r)
                                            setShowBulkActions(false)
                                        }}
                                        className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary hover:text-primary active:scale-95"
                                    >
                                        {r}m
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                bulkToggleAutoCollect(true)
                                setShowBulkActions(false)
                            }}
                            className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-2 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-500/30"
                        >
                            ✓ Enable Auto Collect All
                        </button>

                        <button
                            onClick={() => {
                                bulkToggleAutoCollect(false)
                                setShowBulkActions(false)
                            }}
                            className="rounded-lg bg-muted/50 border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-all hover:border-primary hover:text-primary"
                        >
                            ✕ Disable Auto Collect All
                        </button>
                    </div>
                </div>
            )}
            {/* Bulk Edit Button */}
            <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-semibold text-muted-foreground transition-all hover:border-primary hover:bg-muted/50 hover:text-primary"
            >
                {showBulkActions ? "✕ Close Bulk Edit" : "⚙ Bulk Edit All"}
            </button>

            <button
                onClick={() => onConfirm(cfgs)}
                className="w-full rounded-full bg-blue-500 py-3 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.99]"
            >
                Confirm →
            </button>
        </div>
    )
}
// ─── PinEditor (inline editing) ───────────────────────────────────────────────

function PinEditor({
    pins: initialPins,
    onPinsChange,
    onConfirm,
    onCancel,
}: {
    pins: PinItem[]
    onPinsChange: (pins: PinItem[]) => void
    onConfirm: () => void
    onCancel: () => void
}) {
    const [pins, setPins] = useState(initialPins)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [showBulkEdit, setShowBulkEdit] = useState(false)

    function updatePin(index: number, updates: Partial<PinItem>) {
        const newPins = [...pins]
        newPins[index] = { ...newPins[index]!, ...updates }
        setPins(newPins)
        onPinsChange(newPins)
    }

    function bulkToggleAutoCollect(enabled: boolean) {
        const newPins = pins.map((p) => ({ ...p, autoCollect: enabled }))
        setPins(newPins)
        onPinsChange(newPins)
    }

    function bulkSetRadius(radius: number) {
        const newPins = pins.map((p) => ({ ...p, radius }))
        setPins(newPins)
        onPinsChange(newPins)
    }

    if (editingIndex !== null) {
        const pin = pins[editingIndex]
        return (
            <div className="mt-3 flex flex-col gap-3">
                <div className="rounded-xl border border-border bg-muted/50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">Editing: {pin?.title}</h3>
                        <button
                            onClick={() => setEditingIndex(null)}
                            className="text-muted-foreground hover:text-foreground text-lg"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Pin Number */}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Number of Pins</label>
                            <input
                                type="number"
                                min="1"
                                value={pin?.pinNumber ?? 1}
                                onChange={(e) =>
                                    updatePin(editingIndex, { pinNumber: Math.max(1, parseInt(e.target.value) || 1) })
                                }
                                className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                            />
                        </div>

                        {/* Collection Limit */}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Collection Limit</label>
                            <input
                                type="number"
                                min="1"

                                value={pin?.pinCollectionLimit ?? 100}
                                onChange={(e) =>
                                    updatePin(editingIndex, { pinCollectionLimit: Math.max(1, parseInt(e.target.value) || 100) })
                                }
                                className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                            />
                        </div>

                        {/* Radius */}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Radius (meters)</label>
                            <input
                                type="number"
                                min="1"
                                value={pin?.radius ?? 2}
                                onChange={(e) =>
                                    updatePin(editingIndex, { radius: Math.max(1, parseInt(e.target.value) || 2) })
                                }
                                className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                            />
                        </div>

                        {/* Auto Collect Toggle */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id={`auto-collect-${editingIndex}`}
                                checked={pin?.autoCollect ?? false}
                                onChange={(e) => updatePin(editingIndex, { autoCollect: e.target.checked })}
                                className="h-4 w-4 rounded border-border accent-primary"
                            />
                            <label htmlFor={`auto-collect-${editingIndex}`} className="text-xs font-semibold text-muted-foreground cursor-pointer">
                                Enable Auto Collect
                            </label>
                        </div>

                        <button
                            onClick={() => setEditingIndex(null)}
                            className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95"
                        >
                            Done Editing
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="mt-3 flex flex-col gap-3">
            {/* Bulk Actions */}
            {showBulkEdit && (
                <div className="rounded-xl border border-border bg-muted/50 p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-foreground">Bulk Edit All</h4>
                        <button
                            onClick={() => setShowBulkEdit(false)}
                            className="text-muted-foreground hover:text-foreground text-lg"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Set Radius (m) for All</label>
                            <div className="mt-1 flex gap-1">
                                {[2, 5, 10, 50, 100].map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => {
                                            bulkSetRadius(r)
                                            setShowBulkEdit(false)
                                        }}
                                        className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary hover:text-primary active:scale-95"
                                    >
                                        {r}m
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                bulkToggleAutoCollect(true)
                                setShowBulkEdit(false)
                            }}
                            className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-2 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-500/30"
                        >
                            ✓ Enable Auto Collect All
                        </button>

                        <button
                            onClick={() => {
                                bulkToggleAutoCollect(false)
                                setShowBulkEdit(false)
                            }}
                            className="rounded-lg bg-muted/50 border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-all hover:border-primary hover:text-primary"
                        >
                            ✕ Disable Auto Collect All
                        </button>
                    </div>
                </div>
            )}

            {/* Pin List */}
            <div className="flex max-h-52 flex-col gap-2 overflow-y-auto pr-1">
                {pins.map((p, i) => (
                    <button
                        key={i}
                        onClick={() => setEditingIndex(i)}
                        className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3 text-left transition-all hover:border-primary hover:bg-muted/50 active:scale-[0.98]"
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-foreground">{p.title}</span>
                            <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span><span className="text-foreground/60">Pins: </span>{p.pinNumber ?? 1}</span>
                            <span><span className="text-foreground/60">Limit: </span>{p.pinCollectionLimit ?? "—"}</span>
                            <span><span className="text-foreground/60">Radius: </span>{p.radius ?? 2}m</span>
                            <span><span className={`font-semibold ${p.autoCollect ? "text-emerald-600" : "text-muted-foreground"}`}>Auto: {p.autoCollect ? "✓ Yes" : "No"}</span></span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Bulk Edit Button */}
            <button
                onClick={() => setShowBulkEdit(!showBulkEdit)}
                className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-semibold text-muted-foreground transition-all hover:border-primary hover:bg-muted/50 hover:text-primary"
            >
                {showBulkEdit ? "✕ Close Bulk Edit" : "⚙ Bulk Edit All"}
            </button>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={onCancel}
                    className="flex-1 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:border-primary hover:text-primary"
                >
                    ← Back
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
                >
                    ✓ Generate {pins.length}
                </button>
            </div>
        </div>
    )
}

// ─── ConfirmReview ────────────────────────────────────────────────────────────

function ConfirmReview({
    pins,
    onConfirm,
    onEdit,
}: {
    pins: PinItem[]
    onConfirm: () => void
    onEdit: (msg: string) => void
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [editedPins, setEditedPins] = useState(pins)

    function handleFinishEditing() {
        // Send the updated pins back to the server
        onEdit(`I've made the following changes to the pins. Please generate with these updated settings.`)
    }

    if (isEditing) {
        return (
            <PinEditor
                pins={editedPins}
                onPinsChange={setEditedPins}
                onConfirm={() => {
                    handleFinishEditing()
                    setIsEditing(false)
                }}
                onCancel={() => setIsEditing(false)}
            />
        )
    }

    return (
        <div className="mt-3 flex flex-col gap-3">
            {/* Pin summary */}
            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
                {pins.map((p, i) => (
                    <div key={i} className="rounded-xl border border-border bg-muted/30 p-3">
                        <div className="mb-1.5 flex items-center justify-between">
                            <span className="font-semibold text-sm text-foreground">{p.title}</span>
                            <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span><span className="text-foreground/60">Pins: </span>{p.pinNumber ?? 1}</span>
                            <span><span className="text-foreground/60">Limit: </span>{p.pinCollectionLimit ?? "—"}</span>
                            <span><span className="text-foreground/60">Radius: </span>{p.radius ?? 2}m</span>
                            <span><span className="text-foreground/60">Auto: </span>{p.autoCollect ? "Yes" : "No"}</span>
                            <span className="col-span-2"><span className="text-foreground/60">Start: </span>{fmtDate(p.startDate)}</span>
                            <span className="col-span-2"><span className="text-foreground/60">End: </span>{fmtDate(p.endDate)}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">

                <button
                    onClick={onConfirm}
                    className="flex-1 rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
                >
                    ✓ Generate {pins.length}
                </button>
            </div>
        </div>
    )
}


// ------ Props ------------
interface AgentChatProps {
    creatorId?: string
}


// ─── Main AgentChat ───────────────────────────────────────────────────────────

export default function AgentChat({ creatorId }: AgentChatProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [messages, setMessages] = useState<Message[]>([WELCOME])
    const [input, setInput] = useState("")
    const [agentState, setAgentState] = useState<AgentState>(INITIAL_STATE)

    const [layoutMode] = useState<"modern" | "legacy">(() => {
        const cookieMode = getCookie("wadzzo-layout-mode");
        if (cookieMode === "modern") {
            return "modern";
        }
        if (cookieMode === "legacy") {
            return "legacy";
        }
        if (typeof window !== "undefined") {
            const storedMode = localStorage.getItem("layoutMode");
            if (storedMode === "modern") {
                return "modern";
            }
            if (storedMode === "legacy") {
                return "legacy";
            }
        }
        return "legacy";
    });

    const endRef = useRef<HTMLDivElement>(null)
    const chatMutation = api.agent.chat.useMutation()

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // ── Core send ─────────────────────────────────────────────────────────────

    const send = useCallback(
        async (userMsg: string, stateOverride?: Partial<AgentState> | undefined) => {
            setIsOpen(true)
            if (!userMsg.trim() || chatMutation.isLoading) return

            const currentState = stateOverride
                ? { ...agentState, ...stateOverride }
                : agentState

            const history = messages.map((m) => ({ role: m.role, content: m.content }))

            setMessages((prev) => [...prev, { role: "user", content: userMsg }])
            setInput("")

            try {
                const res = await chatMutation.mutateAsync({
                    message: userMsg,
                    history,
                    state: currentState,
                    creatorId: creatorId
                })

                const newMessage: Message = {
                    role: "assistant" as const,
                    content: res.message,
                    uiData: res.uiData ? {
                        type: res.uiData.type as Message["uiData"] extends { type: infer T } ? T : never,
                        data: res.uiData.data,
                    } : undefined,
                }
                setMessages((prev) => [...prev, newMessage])
                setAgentState(res.state)
            } catch {
                const errorMessage: Message = {
                    role: "assistant" as const,
                    content: "Sorry, something went wrong. Please try again.",
                }
                setMessages((prev) => [...prev, errorMessage])
            }
        },
        [agentState, chatMutation, messages, creatorId],
    )

    // ── Handlers ──────────────────────────────────────────────────────────────

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            void send(input)
        }
    }

    function clear() {
        setMessages([WELCOME])
        setAgentState(INITIAL_STATE)
    }

    function handleTaskSelect(t: AgentTask) {
        void send(
            t === "event" ? "I want to create event pins" : "I want to create landmark pins",
            { task: t },
        )
    }

    function handleEventToggle(ev: EventData) {
        setAgentState((prev) => {
            const sel = prev.selectedEvents ?? []
            const has = sel.some((e) => e.id === ev.id)
            return {
                ...prev,
                selectedEvents: has ? sel.filter((e) => e.id !== ev.id) : [...sel, ev],
            }
        })
    }

    function handleLandmarkToggle(lm: LandmarkData) {
        setAgentState((prev) => {
            const sel = prev.selectedLandmarks ?? []
            const has = sel.some((l) => l.id === lm.id)
            return {
                ...prev,
                selectedLandmarks: has ? sel.filter((l) => l.id !== lm.id) : [...sel, lm],
            }
        })
    }

    function handleEventConfirm() {
        const sel = agentState.selectedEvents ?? []
        console.log("Selected events:", sel)
        void send(
            `Confirmed ${sel.length} events. Please proceed to date configuration.`,
        )
    }

    function handleLandmarkConfirm() {
        const sel = agentState.selectedLandmarks ?? []
        // Server enforces landmark_confirm_list -> landmark_pin_config (skips date step)
        void send(
            `Confirmed ${sel.length} landmarks. Please show pin configuration.`,
            { selectedLandmarks: sel },
        )
    }

    function handleDateConfirm(dates: DateMap) {


        // Merge dates into pinConfig — server reads this when building PinItem[]
        const pinConfigPatch = Object.fromEntries(
            Object.entries(dates).map(([id, d]) => [
                id,
                {
                    ...((agentState.pinConfig as Record<string, Record<string, unknown>> | undefined)?.[id] ?? {}),
                    startDate: fromDateInput(d.startDate),
                    endDate: fromDateInput(d.endDate),
                },
            ]),
        )

        // Server enforces event_pin_dates -> event_pin_config
        void send(
            `Dates confirmed. Please show pin configuration form.`,
            { pinConfig: { ...agentState.pinConfig, ...pinConfigPatch } },
        )
    }

    function handlePinConfigConfirm(cfgs: Record<string, PinCfg>) {


        // Merge new cfg values on top of existing pinConfig entries (preserves dates)
        const merged = Object.fromEntries(
            Object.entries(cfgs).map(([id, c]) => [
                id,
                {
                    ...((agentState.pinConfig as Record<string, Record<string, unknown>> | undefined)?.[id] ?? {}),
                    ...c,
                },
            ]),
        )

        // Server enforces event_pin_config -> event_final_confirm
        //          or landmark_pin_config -> landmark_final_confirm
        void send(
            `Pin configuration confirmed. Please show the final review.`,
            { pinConfig: { ...agentState.pinConfig, ...merged } },
        )
    }

    function handleFinalConfirm() {
        // Find the latest confirm uiData to pass pins back so server can call generate_pins
        const confirmMsg = [...messages].reverse().find((m) => m.uiData?.type === "confirm")
        const pins = (confirmMsg?.uiData?.data as { pins: PinItem[] } | undefined)?.pins ?? []

        void send("Everything looks correct. Please generate the pins now.", { pins })
    }

    function handleFinalEdit(msg: string) {
        // When user finishes editing pins through the editor, we pass the updated pins
        void send(msg, { pins: agentState.pins })
    }

    function handleNewTask(t: AgentTask) {
        setAgentState(INITIAL_STATE)
        void send(
            t === "event" ? "I want to create more event pins" : "I want to create more landmark pins",
            INITIAL_STATE,
        )
    }
    function handleRedeemModeSelect(mode: "separate" | "single") {
        void send(
            mode === "separate"
                ? "Yes, separate redeem code per location."
                : "No, single redeem code for all locations.",
            { redeemMode: mode },
        )
    }
    // ── Render uiData ─────────────────────────────────────────────────────────

    function renderUiData(uiData: Message["uiData"], msgIndex: number) {
        if (!uiData) return null
        const isLast = msgIndex === messages.length - 1

        switch (uiData.type) {
            // ── task_select ──────────────────────────────────────────────────────
            case "task_select":
                return isLast ? <TaskSelect onChoose={handleTaskSelect} /> : null

            // ── event_list ───────────────────────────────────────────────────────
            case "event_list": {
                const { events } = uiData.data as { events: EventData[] }
                if (!isLast)
                    return (
                        <p className="mt-1 text-xs text-muted-foreground">{events.length} events loaded ✓</p>
                    )
                return (
                    <EventList
                        events={events}
                        selected={agentState.selectedEvents ?? events}
                        onToggle={handleEventToggle}
                        onConfirm={handleEventConfirm}
                    />
                )
            }

            // ── landmark_list ────────────────────────────────────────────────────
            case "landmark_list": {
                const { landmarks } = uiData.data as { landmarks: LandmarkData[] }
                if (!isLast)
                    return (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {landmarks.length} landmarks loaded ✓
                        </p>
                    )
                return (
                    <LandmarkList
                        landmarks={landmarks}
                        selected={agentState.selectedLandmarks ?? landmarks}
                        onToggle={handleLandmarkToggle}
                        onConfirm={handleLandmarkConfirm}
                    />
                )
            }
            case "redeem_mode_select":
                if (!isLast) return <p className="mt-1 text-xs text-muted-foreground">Redeem mode selected ✓</p>
                return <RedeemModeSelect onChoose={handleRedeemModeSelect} />

            // ── date_picker ──────────────────────────────────────────────────────
            case "date_picker": {
                const { items } = uiData.data as { items: DatePickerItem[] }
                if (!isLast)
                    return <p className="mt-1 text-xs text-muted-foreground">Dates configured ✓</p>
                return <DatePicker items={items} onConfirm={handleDateConfirm} />
            }

            // ── pin_config_form ──────────────────────────────────────────────────
            case "pin_config_form": {
                const { items, isLandmark } = uiData.data as {
                    items: Array<{ id: string; title: string, latitude: number, longitude: number }>
                    isLandmark: boolean
                }
                if (!isLast)
                    return <p className="mt-1 text-xs text-muted-foreground">Pin config set ✓</p>
                return (
                    <PinConfigForm
                        items={items}
                        isLandmark={isLandmark}
                        onConfirm={handlePinConfigConfirm}
                    />
                )
            }

            // ── confirm ──────────────────────────────────────────────────────────
            case "confirm": {
                const { pins } = uiData.data as { pins: PinItem[] }
                if (!isLast)
                    return (
                        <p className="mt-1 text-xs text-muted-foreground">{pins.length} pins reviewed ✓</p>
                    )
                return (
                    <ConfirmReview
                        pins={pins}
                        onConfirm={handleFinalConfirm}
                        onEdit={handleFinalEdit}
                    />
                )
            }

            // ── pin_result ───────────────────────────────────────────────────────
            case "pin_result": {
                const { count, jobId } = uiData.data as { count: number; jobId?: string }
                return <PinJobProgress count={count} jobId={jobId} onNew={handleNewTask} />
            }
            // ── next_action ──────────────────────────────────────────────────────
            case "next_action":
                if (!isLast) return null
                return (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleNewTask("event")}
                            className="rounded-xl border border-border bg-muted/40 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary hover:bg-primary/5 active:scale-95"
                        >
                            📅 More Events
                        </button>
                        <button
                            onClick={() => handleNewTask("landmark")}
                            className="rounded-xl border border-border bg-muted/40 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary hover:bg-primary/5 active:scale-95"
                        >
                            📍 More Landmarks
                        </button>
                    </div>
                )

            default:
                return null
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            {/* Minimized pill */}
            {isMinimized && (
                <button
                    onClick={() => {
                        setIsMinimized(false)
                        setIsOpen(true)
                    }}
                    className={`fixed left-1/2 z-40 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 ${layoutMode === "modern" ? "bottom-32" : "bottom-12"}`}
                >
                    Wadzzo Assistant
                </button>
            )}

            {/* Neon input bar */}
            {!isMinimized && (
                <div className={`fixed left-1/2 z-40 w-full max-w-2xl -translate-x-1/2 px-4 ${layoutMode === "modern" ? "bottom-24" : "bottom-6"}`}>
                    <style>{`
            @keyframes neon-glow {
              0%, 100% { box-shadow: 0 0 5px rgba(34,197,94,.3), 0 0 10px rgba(34,197,94,.2); }
              50%       { box-shadow: 0 0 15px rgba(34,197,94,.6), 0 0 25px rgba(34,197,94,.4); }
            }
            .neon-bar {
              animation: neon-glow 3s ease-in-out infinite;
              border: 2px solid rgba(34,197,94,.5);
            }
          `}</style>

                    <div className="neon-bar flex items-center gap-2 rounded-full bg-white p-1 shadow-lg backdrop-blur-sm">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me anything..."
                            disabled={chatMutation.isLoading}
                            className="flex-1 rounded-full bg-white px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                        />
                        <button
                            onClick={() => void send(input)}
                            disabled={!input.trim() || chatMutation.isLoading}
                            className="flex flex-shrink-0 items-center justify-center rounded-full bg-primary px-4 py-3 text-primary-foreground transition-all hover:scale-105 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {chatMutation.isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Send className="h-5 w-5" />
                            )}
                        </button>
                        <button
                            onClick={() => setIsOpen((p) => !p)}
                            className="flex flex-shrink-0 items-center justify-center rounded-full bg-primary/80 px-4 py-3 text-primary-foreground transition-all hover:scale-105 active:scale-95"
                        >
                            <ChevronDown
                                className={`h-5 w-5 transition-transform duration-300 ${isOpen ? "" : "rotate-180"}`}
                            />
                        </button>
                    </div>
                </div>
            )}

            {/* Chat drawer */}
            {isOpen && !isMinimized && (
                <div className={`fixed inset-x-0 z-40 mx-auto flex h-[70vh] max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-in slide-in-from-bottom-5 duration-300 ${layoutMode === "modern" ? "bottom-40" : "bottom-24"}`}>
                    {/* Header */}
                    <div className="flex flex-shrink-0 items-center justify-between bg-primary px-5 py-3 text-primary-foreground">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Wadzzo Assistant</p>
                                <p className="text-[11px] text-white/70">Pin Generation Agent</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={clear}
                                title="Clear chat"
                                className="rounded-full p-2 transition-colors hover:bg-white/20"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => { setIsMinimized(true); setIsOpen(false) }}
                                title="Minimize"
                                className="rounded-full p-2 transition-colors hover:bg-white/20"
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                title="Close"
                                className="rounded-full p-2 transition-colors hover:bg-white/20"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 space-y-4 overflow-y-auto p-5">
                        {messages.map((msg, i) => (
                            <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                                {msg.role === "user" ? (
                                    /* User bubble */
                                    <div className="flex justify-end">
                                        <div className="max-w-[78%] rounded-3xl rounded-tr-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
                                            {msg.content}
                                        </div>
                                    </div>
                                ) : (
                                    /* Assistant bubble */
                                    <div className="flex justify-start">
                                        <div className="max-w-[88%] rounded-3xl rounded-tl-lg bg-muted px-4 py-3 shadow-sm">
                                            {msg.content && msg.uiData?.type !== "redeem_mode_select" && (
                                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                                                    {msg.content}
                                                </p>
                                            )}
                                            {msg.uiData && renderUiData(msg.uiData, i)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {chatMutation.isLoading && (
                            <div className="flex justify-start animate-in fade-in">
                                <div className="rounded-3xl rounded-tl-lg bg-muted px-4 py-3 shadow-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-xs">Thinking…</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={endRef} />
                    </div>
                </div>
            )}
        </>
    )
}

// Component
function RedeemModeSelect({ onChoose }: { onChoose: (mode: "separate" | "single") => void }) {
    return (
        <>
            <div
                className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground"
            >
                Choose user collection limit : One pin/redeem code at each landmark location, One pin/redeem code for all landmarks
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                    onClick={() => onChoose("separate")}
                    className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/40 p-4 text-left transition-all hover:border-primary hover:bg-primary/5 active:scale-95"
                >
                    <span className="text-2xl">✅</span>
                    <span className="font-bold text-sm text-foreground">One pin/code per landmark</span>

                </button>
                <button
                    onClick={() => onChoose("single")}
                    className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/40 p-4 text-left transition-all hover:border-primary hover:bg-primary/5 active:scale-95"
                >
                    <span className="text-2xl">🎟️</span>
                    <span className="font-bold text-sm text-foreground">One pin/code for all landmarks</span>

                </button>
            </div>
        </>
    )
}




// ─── Sub-component: progress bar ─────────────────────────────────────────────

function ProgressBar({ completed, total }: { completed: number; total: number }) {
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    return (
        <div className="w-full">
            <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{completed} / {total} pins</span>
                <span>{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    )
}

// ─── Sub-component: log accordion ────────────────────────────────────────────

function LogAccordion({ log }: { log: LogEntry[] }) {
    const [open, setOpen] = useState(false)
    if (log.length === 0) return null

    return (
        <div className="mt-2 w-full rounded-xl border border-border overflow-hidden">
            <button
                onClick={() => setOpen((p) => !p)}
                className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/30 transition-colors"
            >
                <span>Pin details ({log.length})</span>
                {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {open && (
                <div className="max-h-44 overflow-y-auto divide-y divide-border">
                    {log.map((entry, i) => (
                        <div key={i} className="flex items-start gap-2 px-3 py-2">
                            {entry.status === "ok" ? (
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                            ) : (
                                <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                            )}
                            <div className="min-w-0">
                                <p className="truncate text-xs font-medium text-foreground">{entry.title}</p>
                                {entry.error && (
                                    <p className="text-[11px] text-red-500 leading-tight">{entry.error}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PinJobProgress({ count, jobId, onNew }: PinJobProgressProps) {
    const [status, setStatus] = useState<JobStatus>("pending")
    const [completed, setCompleted] = useState(0)
    const [total, setTotal] = useState(count)
    const [log, setLog] = useState<LogEntry[]>([])
    const [error, setError] = useState<string | null>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // If no jobId, we can't poll — just show a static success state
    const canPoll = Boolean(jobId)

    const jobStatusQuery = api.agent.jobStatus.useQuery(
        { jobId: jobId! },
        {
            enabled: canPoll && status !== "completed" && status !== "failed",
            refetchInterval: (data) => {
                // Stop polling when terminal
                if (data?.status === "completed" || data?.status === "failed") return false
                return 1500
            },
            refetchIntervalInBackground: true,
        },
    )

    // Sync query data into local state
    useEffect(() => {
        const data = jobStatusQuery.data
        if (!data) return
        setStatus(data.status)
        setTotal(data.total || count)
        setCompleted(data.completed)
        setLog(data.log ?? [])
        if (data.error) setError(data.error)
    }, [jobStatusQuery.data, count])

    // Cleanup on unmount
    useEffect(() => {
        const currentInterval = intervalRef.current
        return () => {
            if (currentInterval) clearInterval(currentInterval)
        }
    }, [])

    const isTerminal = status === "completed" || status === "failed"
    const statusLabel =
        status === "completed"
            ? "All pins created!"
            : status === "failed"
                ? "Some pins failed"
                : status === "processing"
                    ? "Creating pins…"
                    : "Queued…"

    return (
        <div className="mt-3 flex flex-col items-center gap-4 py-2">
            {/* Icon */}
            <div
                className={`flex h-14 w-14 items-center justify-center rounded-full ${status === "completed"
                    ? "bg-emerald-500/10"
                    : status === "failed"
                        ? "bg-red-500/10"
                        : "bg-primary/10"
                    }`}
            >
                <StatusIcon status={status} />
            </div>

            {/* Status label */}
            <div className="text-center">
                <p className="font-bold text-foreground">{statusLabel}</p>
                {!isTerminal && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Hang tight, this runs in the background.
                    </p>
                )}
                {status === "completed" && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        They{"'"}ll appear on the map once approved.
                    </p>
                )}
                {error && (
                    <p className="mt-1 text-xs text-red-500">{error}</p>
                )}
            </div>

            {/* Progress bar (hide when terminal with no partial data) */}
            {canPoll && (
                <div className="w-full">
                    <ProgressBar completed={completed} total={total} />
                </div>
            )}

            {/* Per-pin log */}
            <LogAccordion log={log} />

            {/* Create more (only when done) */}
            {isTerminal && (
                <>
                    <p className="text-sm text-muted-foreground">Want to create more?</p>
                    <div className="grid w-full grid-cols-2 gap-2">
                        <button
                            onClick={() => onNew("event")}
                            className="rounded-xl border border-border bg-muted/40 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary hover:bg-primary/5 active:scale-95"
                        >
                            📅 Event Pins
                        </button>
                        <button
                            onClick={() => onNew("landmark")}
                            className="rounded-xl border border-border bg-muted/40 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary hover:bg-primary/5 active:scale-95"
                        >
                            📍 Landmark Pins
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}