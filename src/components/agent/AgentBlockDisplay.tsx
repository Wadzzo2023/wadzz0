"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
    ChevronDown, ChevronRight, CheckCircle2,
    Loader2, MapPin, Minus, Send, Trash2, X,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/shadcn/ui/button";
import { RadioGroup, RadioGroupItem } from "~/components/shadcn/ui/radio-group";
import { Label } from "~/components/shadcn/ui/label";
import { Switch } from "~/components/shadcn/ui/switch";

// ── Shared blocks (all from their own files) ──────────────────────────────────
import { InfoBlock } from "~/components/agent/blocks/info-block";
import { ListBlock } from "~/components/agent/blocks/list-block";
import { SuccessBlock } from "~/components/agent/blocks/success-block";

// ── Types ─────────────────────────────────────────────────────────────────────
import type {
    AgentResponse, AgentStage, AgentMode,
    LocalChatMessage, PinIntent, PinOptions, Pin,
    QuestionResponse, ResultsResponse, ConfirmResponse,
    SuccessResponse, InfoResponse, GroupingMode,
} from "~/lib/agent/types";
import { STAGE_LABEL } from "~/lib/agent/types";
import type { PinEditFields, HotspotScope, LocationEditFields } from "~/components/agent/pins/pin-edit-form";
import type { HotspotEditFields } from "~/components/agent/hotspot/hotspot-edit-form";
import { api } from "~/utils/api";

// ─── Suggestions shown on empty chat ─────────────────────────────────────────

const SUGGESTIONS = [
    "Drop 100 KFC pins in the US",
    "100 restaurants in Geneseo Area",
    "Music events worldwide",
    "Drop pins around hospitals in Tokyo",
    "Show me my pins",
    "How are my pins performing?",
    "Generate a report for my pins",
    "Show collection report",
];

// ─── Shared helpers ───────────────────────────────────────────────────────────

function fmt(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(undefined, {
        month: "short", day: "numeric", year: "numeric",
    });
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(undefined, {
        month: "short", day: "numeric", year: "numeric",
    });
}

function TypingDots({ label }: { label?: string }) {
    return (
        <div className="flex items-center gap-2 py-0.5">
            <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </div>
            {label && (
                <span className="text-xs text-muted-foreground">{label}</span>
            )}
        </div>
    );
}

function ModeBadge({ mode }: { mode?: AgentMode }) {
    if (!mode) return null;
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mb-1",
                mode === "management"
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
            )}
        >
            {mode === "management" ? "📋 Managing pins" : "🌍 Searching locations"}
        </span>
    );
}

// ─── QuestionBlock (pin-drop flow — do not change) ────────────────────────────

function QuestionBlock({
    data, onAnswer, answered = false, answeredValues,
}: {
    data: QuestionResponse;
    onAnswer: (answers: Record<string, string>) => void;
    answered?: boolean;
    answeredValues?: Record<string, string>;
}) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [customValues, setCustomValues] = useState<Record<string, string>>({});
    const [showCustom, setShowCustom] = useState<Record<string, boolean>>({});
    const [currentIdx, setCurrentIdx] = useState(0);
    const fields = data.fields;
    const current = fields[currentIdx];

    if (answered && answeredValues) {
        return (
            <div className="mt-2 flex flex-col gap-1.5">
                {fields.map((f) => (
                    <div
                        key={f.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/50 opacity-70"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-[12px] text-muted-foreground">{f.label}:</span>
                        <span className="text-[12px] font-semibold text-foreground truncate">
                            {answeredValues[f.id] ?? "—"}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    const handleChoice = (fieldId: string, value: string) => {
        const updated = { ...answers, [fieldId]: value };
        setAnswers(updated);
        const next = currentIdx + 1;
        if (next < fields.length) setCurrentIdx(next);
        else onAnswer(updated);
    };

    const handleCustomSubmit = (fieldId: string) => {
        const val = customValues[fieldId]?.trim();
        if (!val) return;
        handleChoice(fieldId, val);
    };

    if (!current) return null;
    const isChoice = current.inputType === "multiple_choice";
    const showingCustom = showCustom[current.id];

    return (
        <div className="mt-2 space-y-3">
            {fields.length > 1 && (
                <div className="flex items-center gap-1.5">
                    {fields.map((_, i) => (
                        <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${i < currentIdx
                                ? "bg-primary"
                                : i === currentIdx
                                    ? "bg-foreground"
                                    : "bg-muted"
                                }`}
                        />
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-1">
                        {currentIdx + 1}/{fields.length}
                    </span>
                </div>
            )}
            <p className="text-[13px] font-semibold text-foreground">{current.label}</p>
            {isChoice && current.options && !showingCustom && (
                <div className="flex flex-col gap-1.5">
                    {current.options.map((opt, idx) => (
                        <button
                            key={opt}
                            onClick={() => handleChoice(current.id, opt)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left bg-muted border border-border text-foreground text-[13px] hover:bg-primary/10 hover:border-primary/40 transition-all duration-150 active:scale-[0.98]"
                        >
                            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground flex-shrink-0">
                                {idx + 1}
                            </span>
                            <span className="font-medium">{opt}</span>
                        </button>
                    ))}
                    <button
                        onClick={() => setShowCustom((p) => ({ ...p, [current.id]: true }))}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left bg-transparent border border-dashed border-border text-muted-foreground text-[13px] hover:text-foreground hover:border-primary/50 transition-all"
                    >
                        <span className="w-6 h-6 rounded-full border border-border flex items-center justify-center flex-shrink-0">
                            <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                <path d="M6 1v10M1 6h10" />
                            </svg>
                        </span>
                        <span>Something else…</span>
                    </button>
                </div>
            )}
            {(showingCustom ?? !isChoice) && (
                <div className="flex items-center gap-2">
                    <input
                        autoFocus
                        type={current.inputType === "number" ? "number" : "text"}
                        value={customValues[current.id] ?? ""}
                        onChange={(e) => setCustomValues((p) => ({ ...p, [current.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") handleCustomSubmit(current.id); }}
                        placeholder={current.placeholder ?? "Type your answer…"}
                        className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-foreground text-sm placeholder-muted-foreground border border-border focus:border-primary focus:outline-none transition-colors"
                    />
                    <button
                        onClick={() => handleCustomSubmit(current.id)}
                        disabled={!customValues[current.id]?.trim()}
                        className="px-3 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 text-primary-foreground text-sm font-bold transition-colors flex-shrink-0"
                    >
                        →
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── JobProgressBar (pin-drop — do not change) ────────────────────────────────

function JobProgressBar({ jobId, onComplete }: {
    jobId: string;
    onComplete: (count: number) => void;
}) {
    const [done, setDone] = useState(false);
    const { data } = api.agent.jobStatus.useQuery(
        { jobId },
        {
            enabled: !done,
            refetchInterval: (d) => {
                if (!d) return 1500;
                const s = (d as { status?: string })?.status;
                if (s === "completed" || s === "failed") return false;
                return 1500;
            },
        },
    );
    useEffect(() => {
        if (!data) return;
        if (data.status === "completed" || data.status === "failed") {
            setDone(true);
            onComplete(data.completed ?? 0);
        }
    }, [data, onComplete]);

    const status = data?.status ?? "pending";
    const total = data?.total ?? 0;
    const completed = data?.completed ?? 0;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isError = status === "failed";
    const isDone = status === "completed";

    return (
        <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                    {isDone ? "Pins dropped!" : isError ? "Some pins failed" : "Dropping pins…"}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                    {completed}/{total}
                </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all duration-500", isError ? "bg-red-500" : "bg-emerald-500")}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {isError && data?.error && (
                <p className="text-[11px] text-red-400">{data.error}</p>
            )}
            {(isDone || isError) && data?.log && data.log.length > 0 && (
                <details className="mt-1">
                    <summary className="text-[11px] text-muted-foreground cursor-pointer select-none">
                        View log ({data.log.filter((l) => l.status === "error").length} errors)
                    </summary>
                    <div className="mt-1.5 space-y-0.5 max-h-32 overflow-y-auto">
                        {data.log.map((entry, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px]">
                                <span className={entry.status === "ok" ? "text-emerald-500" : "text-red-400"}>
                                    {entry.status === "ok" ? "✓" : "✗"}
                                </span>
                                <span className="text-foreground truncate">{entry.title}</span>
                                {entry.error && (
                                    <span className="text-red-400 truncate">— {entry.error}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
}

// ─── ResultsConfirmPanel (pin-drop — do not change) ──────────────────────────

function ResultsConfirmPanel({
    pinCount, onConfirm, isLoading = false, detectedPinNumber = 1,
}: {
    pinCount: number;
    onConfirm: (options: PinOptions) => void;
    isLoading?: boolean;
    detectedPinNumber?: number;
}) {
    const [autoCollect, setAutoCollect] = useState(false);
    const [groupingMode, setGroupingMode] = useState<GroupingMode>("per-location");
    const [pinNumber, setPinNumber] = useState(detectedPinNumber ?? 1);
    const [step, setStep] = useState(0);

    useEffect(() => { setPinNumber(detectedPinNumber ?? 1); }, [detectedPinNumber]);

    const isLast = step === 1;
    const handleNext = () => {
        if (!isLast) setStep(step + 1);
        else onConfirm({ autoCollect, groupingMode, pinNumber });
    };

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-3 max-w-sm">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">Configuration</p>
                <span className="text-[10px] text-muted-foreground font-medium">{step + 1}/2</span>
            </div>

            {step === 0 && (
                <section className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Location QR Code</p>
                    <RadioGroup
                        value={groupingMode}
                        onValueChange={(v) => setGroupingMode(v as GroupingMode)}
                        className="flex flex-col gap-1.5"
                    >
                        {[
                            { value: "per-location", label: `${pinCount} QR codes`, desc: "Each pin has its own code" },
                            { value: "single-group", label: "1 QR code", desc: "All pins grouped together" },
                        ].map((opt) => (
                            <Label
                                key={opt.value}
                                htmlFor={`group-${opt.value}`}
                                className={cn(
                                    "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition-all",
                                    groupingMode === opt.value
                                        ? "border-primary/50 bg-primary/10"
                                        : "border-border bg-muted/30 hover:bg-muted/50",
                                )}
                            >
                                <RadioGroupItem id={`group-${opt.value}`} value={opt.value} className="mt-0.5 shrink-0" />
                                <div className="flex flex-col gap-0.5 flex-1">
                                    <span className={cn("text-xs font-medium", groupingMode === opt.value ? "text-primary" : "text-foreground")}>
                                        {opt.label}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground leading-tight">{opt.desc}</span>
                                </div>
                            </Label>
                        ))}
                    </RadioGroup>
                </section>
            )}

            {step === 1 && (
                <section className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Auto Mode</p>
                    <div className={cn(
                        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                        autoCollect ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30",
                    )}>
                        <div className="flex flex-col gap-1 flex-1">
                            <Label htmlFor="auto-collect-switch" className="cursor-pointer text-xs font-medium text-foreground">
                                {autoCollect ? "Enabled" : "Disabled"}
                            </Label>
                            <p className="text-[11px] text-muted-foreground leading-tight">
                                {autoCollect ? "Automatic on proximity" : "Manual tap to collect"}
                            </p>
                        </div>
                        <Switch id="auto-collect-switch" checked={autoCollect} onCheckedChange={setAutoCollect} />
                    </div>

                    <p className="text-xs font-medium text-muted-foreground mt-1">Pins per Location</p>
                    <div className={cn(
                        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                        pinNumber > 1 ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30",
                    )}>
                        <div className="flex flex-col gap-1 flex-1">
                            <Label className="text-xs font-medium text-foreground">Pin Number</Label>
                            <p className="text-[11px] text-muted-foreground leading-tight">
                                {pinNumber === 1 ? "One pin per location" : `${pinNumber} pins at each location`}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setPinNumber((n) => Math.max(1, n - 1))}
                                disabled={pinNumber <= 1}
                                className={cn(
                                    "w-7 h-7 rounded-lg border flex items-center justify-center text-sm font-bold transition-all active:scale-95 flex-shrink-0",
                                    pinNumber <= 1
                                        ? "border-border bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
                                        : "border-border bg-muted hover:bg-muted/80 text-foreground",
                                )}
                            >
                                −
                            </button>
                            <input
                                type="number" min={1} max={200} value={pinNumber}
                                onChange={(e) => {
                                    const p = parseInt(e.target.value, 10);
                                    if (!isNaN(p)) setPinNumber(Math.min(200, Math.max(1, p)));
                                }}
                                className={cn(
                                    "w-12 h-7 rounded-lg border text-center text-sm font-semibold bg-muted text-foreground tabular-nums focus:outline-none focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                    pinNumber > 1 ? "border-primary/40" : "border-border",
                                )}
                            />
                            <button
                                type="button"
                                onClick={() => setPinNumber((n) => Math.min(200, n + 1))}
                                className="w-7 h-7 rounded-lg border border-border bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center text-sm font-bold transition-all active:scale-95 flex-shrink-0"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {pinNumber > 1 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 w-fit">
                            <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                            <span className="text-[11px] font-semibold text-primary">
                                {pinCount * pinNumber} total pins
                                <span className="font-normal text-primary/70 ml-1">
                                    ({pinCount} locations × {pinNumber})
                                </span>
                            </span>
                        </div>
                    )}
                </section>
            )}

            <div className="flex items-center gap-2 mt-2">
                <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0 || isLoading}
                    className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border border-border",
                        step === 0 || isLoading
                            ? "opacity-40 cursor-not-allowed bg-muted/30 text-muted-foreground"
                            : "bg-muted hover:bg-muted/80 text-foreground active:scale-95",
                    )}
                >
                    ← Previous
                </button>
                <button
                    type="button"
                    onClick={handleNext}
                    disabled={isLoading}
                    className={cn(
                        "flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 bg-primary text-primary-foreground hover:opacity-90 active:scale-95",
                        isLoading && "opacity-60 cursor-not-allowed",
                    )}
                >
                    {isLoading
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <>{isLast ? "Confirm" : "Next"}<ChevronRight className="h-3 w-3" /></>
                    }
                </button>
            </div>
        </div>
    );
}

// ─── PinCard (pin-drop — do not change) ──────────────────────────────────────

function PinCard({ pin, compact = false }: { pin: Pin; compact?: boolean }) {
    const handleOpen = () =>
        window.open(
            `https://www.google.com/maps?q=${pin.latitude},${pin.longitude}`,
            "_blank",
            "noreferrer",
        );

    return (
        <div
            onClick={handleOpen}
            className={cn(
                "flex items-start gap-2.5 rounded-xl border border-border bg-muted/50 cursor-pointer hover:bg-muted hover:border-border/80 transition-colors",
                compact ? "px-3 py-2" : "px-3 py-2.5",
            )}
        >
            {pin.image && !compact && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={pin.image}
                    alt={pin.title}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-muted"
                />
            )}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-bold flex-shrink-0",
                        pin.type === "EVENT"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-primary/20 text-primary",
                    )}>
                        {pin.type ?? "LANDMARK"}
                    </span>
                    <p className="text-foreground text-xs font-medium truncate">{pin.title}</p>
                </div>
                {pin.address && !compact && (
                    <p className="text-muted-foreground text-[11px] truncate">{pin.address}</p>
                )}
                {pin.description && !compact && (
                    <p className="text-muted-foreground text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
                        {pin.description}
                    </p>
                )}
                {pin.type === "EVENT" && pin.startDate && (
                    <p className="text-amber-500/60 text-[11px] mt-0.5">
                        {formatDate(pin.startDate)}{pin.endDate ? ` → ${formatDate(pin.endDate)}` : ""}
                    </p>
                )}
                {!compact && (
                    <div className="flex items-center gap-1 mt-1">
                        <svg viewBox="0 0 16 16" className="w-3 h-3 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 1.5C5.79 1.5 4 3.29 4 5.5c0 3.25 4 9 4 9s4-5.75 4-9c0-2.21-1.79-4-4-4z" />
                            <circle cx="8" cy="5.5" r="1.25" />
                        </svg>
                        <span className="text-muted-foreground text-[10px] font-mono">
                            {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── ResultsBlock (pin-drop — do not change) ──────────────────────────────────

function ResultsBlock({
    data, pins, onConfirm, onDismiss, isLoading,
    confirmed, jobId, onJobComplete, detectedPinNumber,
}: {
    data: ResultsResponse;
    pins: Pin[];
    onConfirm: (options: PinOptions) => void;
    onDismiss: () => void;
    isLoading: boolean;
    confirmed: boolean;
    jobId?: string;
    onJobComplete: (count: number) => void;
    detectedPinNumber?: number;
}) {
    const count = pins.length || data.pinCount;
    return (
        <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground">{data.message}</p>
            {pins.length > 0 && (
                <div className="space-y-1.5 overflow-y-auto pr-0.5" style={{ maxHeight: "300px" }}>
                    {pins.map((pin) => <PinCard key={pin.id} pin={pin} />)}
                </div>
            )}
            {jobId ? (
                <JobProgressBar jobId={jobId} onComplete={onJobComplete} />
            ) : confirmed ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-xs text-emerald-400 font-semibold">
                        Queued {count} pins for drop
                    </span>
                </div>
            ) : (
                <>
                    <ResultsConfirmPanel
                        pinCount={count}
                        onConfirm={onConfirm}
                        isLoading={isLoading}
                        detectedPinNumber={detectedPinNumber}
                    />
                    <button
                        onClick={onDismiss}
                        className="w-full py-2 rounded-xl bg-muted border border-border text-muted-foreground text-sm hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                </>
            )}
        </div>
    );
}

// ─── PinDropConfirmBlock (pin-drop — do not change) ───────────────────────────

function PinDropConfirmBlock({
    data, pins, onConfirm, onDismiss, isDropping,
}: {
    data: ConfirmResponse;
    pins: Pin[];
    onConfirm: (pins: Pin[]) => void;
    onDismiss: () => void;
    isDropping: boolean;
}) {
    const rows = [
        { label: "What", value: data.summary.what ?? "—" },
        { label: "Where", value: data.summary.where ?? "—" },
        { label: "Count", value: `${data.summary.count ?? 0} pins` },
        { label: "Type", value: data.summary.type ?? "LANDMARK", badge: true },
    ];
    return (
        <div className="space-y-3">
            <div className="rounded-xl bg-muted/30 border border-border divide-y divide-border">
                {rows.map(({ label, value, badge }) => (
                    <div key={label} className="flex items-center justify-between px-3 py-2.5">
                        <span className="text-muted-foreground text-xs">{label}</span>
                        {badge ? (
                            <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                value === "EVENT"
                                    ? "bg-amber-500/15 text-amber-400"
                                    : "bg-primary/15 text-primary",
                            )}>
                                {value}
                            </span>
                        ) : (
                            <span className="text-foreground text-xs font-semibold">{value}</span>
                        )}
                    </div>
                ))}
            </div>
            {pins.length > 0 && (
                <div className="space-y-1 overflow-y-auto pr-0.5" style={{ maxHeight: "220px" }}>
                    {pins.map((pin) => <PinCard key={pin.id} pin={pin} compact />)}
                </div>
            )}
            <div className="flex gap-2">
                <button
                    onClick={() => onConfirm(pins)}
                    disabled={isDropping}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white text-sm font-bold transition-colors shadow-lg shadow-emerald-500/20"
                >
                    {isDropping
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Dropping…</>
                        : <><span>📍</span> Confirm &amp; Drop Pins</>
                    }
                </button>
                <button
                    onClick={onDismiss}
                    disabled={isDropping}
                    className="px-4 py-3 rounded-xl bg-muted border border-border text-muted-foreground text-sm hover:text-foreground transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ─── ManagementConfirmBlock ───────────────────────────────────────────────────

function ManagementConfirmBlock({
    data, onConfirm, onDismiss,
}: {
    data: ConfirmResponse;
    onConfirm: () => void;
    onDismiss: () => void;
}) {
    const { action, targets, count, affected, unaffected } = data.summary;
    const actionLabel: Record<string, string> = {
        edit: "Edit", delete: "Hide", pause: "Pause", resume: "Resume",
    };
    const actionColor: Record<string, string> = {
        edit: "bg-blue-500 hover:bg-blue-400 shadow-blue-500/20",
        delete: "bg-red-500 hover:bg-red-400 shadow-red-500/20",
        pause: "bg-amber-500 hover:bg-amber-400 shadow-amber-500/20",
        resume: "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20",
    };
    return (
        <div className="space-y-3">
            <p className="text-[13px] leading-relaxed text-foreground">{data.message}</p>
            <div className="rounded-xl bg-muted/30 border border-border divide-y divide-border">
                {action && (
                    <div className="flex items-center justify-between px-3 py-2.5">
                        <span className="text-muted-foreground text-xs">Action</span>
                        <span className="text-foreground text-xs font-semibold capitalize">
                            {actionLabel[action] ?? action}
                        </span>
                    </div>
                )}
                {count != null && (
                    <div className="flex items-center justify-between px-3 py-2.5">
                        <span className="text-muted-foreground text-xs">Pins affected</span>
                        <span className="text-foreground text-xs font-semibold">{count}</span>
                    </div>
                )}
                {affected && (
                    <div className="px-3 py-2.5">
                        <p className="text-muted-foreground text-xs mb-1">Will change</p>
                        <p className="text-foreground text-xs">{affected}</p>
                    </div>
                )}
                {unaffected && (
                    <div className="px-3 py-2.5">
                        <p className="text-muted-foreground text-xs mb-1">Will NOT change</p>
                        <p className="text-foreground text-xs">{unaffected}</p>
                    </div>
                )}
            </div>
            {targets && targets.length > 0 && (
                <div className="space-y-1">
                    {targets.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/50">
                            <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                            <span className="text-[12px] text-foreground truncate">{t}</span>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex gap-2">
                <button
                    onClick={onConfirm}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-colors shadow-lg",
                        action
                            ? (actionColor[action] ?? "bg-primary hover:bg-primary/90 shadow-primary/20")
                            : "bg-primary hover:bg-primary/90",
                    )}
                >
                    {actionLabel[action ?? ""] ?? "Confirm"}
                </button>
                <button
                    onClick={onDismiss}
                    className="px-4 py-3 rounded-xl bg-muted border border-border text-muted-foreground text-sm hover:text-foreground transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ─── AgentResponseBlock ───────────────────────────────────────────────────────
// Dispatches the agent response to the correct block.

function AgentResponseBlock({
    response, pins, intent, mode,
    onAnswer, onConfirmWithOptions, onConfirmPins,
    onConfirmManagement, onDismiss,
    onEdit, onDelete, onEditHotspot, onDeleteHotspot,
    onPauseHotspot, onResumeHotspot,
    onLoadMore, isLoadingMore,
    isDropping, isLoading,
    questionAnswered, questionAnsweredValues,
    resultsConfirmed, resultsJobId,
    onViewLocationCollectors,  // ← ADD
    onJobComplete,
    onListConfirm, onListDismiss,
    isSlate,
}: {
    response: AgentResponse;
    pins: Pin[];
    intent: PinIntent;
    mode?: AgentMode;
    onAnswer: (answers: Record<string, string>) => void;
    onConfirmWithOptions: (options: PinOptions) => void;
    onConfirmPins: (pins: Pin[]) => void;
    onConfirmManagement: () => void;
    onDismiss: () => void;
    onEdit?: (ids: string[], fields: PinEditFields, scope?: HotspotScope, locationEdits?: Record<string, LocationEditFields>) => void;
    onDelete?: (ids: string[]) => void;
    onEditHotspot?: (hotspotId: string, fields: HotspotEditFields) => void;
    onDeleteHotspot?: (hotspotId: string) => void;
    onPauseHotspot?: (hotspotId: string) => void;
    onResumeHotspot?: (hotspotId: string) => void;
    onViewLocationCollectors: (locationId: string) => void;
    onLoadMore?: (nextOffset: number) => void;
    isLoadingMore?: boolean;
    isDropping: boolean;
    isLoading: boolean;
    questionAnswered?: boolean;
    questionAnsweredValues?: Record<string, string>;
    resultsConfirmed?: boolean;
    resultsJobId?: string;
    onJobComplete: (count: number) => void;
    onListConfirm: (selectedIds: string[]) => void;
    onListDismiss: () => void;
    isSlate?: boolean;
}) {
    switch (response.type) {

        case "question":
            return (
                <div>
                    <ModeBadge mode={mode} />
                    <p className="text-[13px] leading-relaxed text-foreground mb-1">
                        {response.message}
                    </p>
                    <QuestionBlock
                        data={response}
                        onAnswer={onAnswer}
                        answered={questionAnswered}
                        answeredValues={questionAnsweredValues}
                    />
                </div>
            );

        case "results":
            return (
                <div>
                    <ModeBadge mode={mode} />
                    <ResultsBlock
                        data={response}
                        pins={pins}
                        onConfirm={onConfirmWithOptions}
                        onDismiss={onDismiss}
                        isLoading={isLoading}
                        confirmed={resultsConfirmed ?? false}
                        jobId={resultsJobId}
                        onJobComplete={onJobComplete}
                        detectedPinNumber={intent.pinNumber ?? 1}
                    />
                </div>
            );

        case "confirm":
            return (
                <div>
                    <ModeBadge mode={mode} />
                    {mode === "management" || response.summary?.action ? (
                        <ManagementConfirmBlock
                            data={response}
                            onConfirm={onConfirmManagement}
                            onDismiss={onDismiss}
                        />
                    ) : (
                        <PinDropConfirmBlock
                            data={response}
                            pins={pins}
                            onConfirm={onConfirmPins}
                            onDismiss={onDismiss}
                            isDropping={isDropping}
                        />
                    )}
                </div>
            );

        case "success":
            return <SuccessBlock data={response} />;

        // case "list":
        //     return (
        //         <div>
        //             <ModeBadge mode={mode} />
        //             <ListBlock
        //                 data={response}
        //                 onConfirm={onListConfirm}
        //                 onDismiss={onListDismiss}
        //             />
        //         </div>
        //     );

        case "info":
        default:
            return (
                <div>
                    <ModeBadge mode={mode} />
                    <InfoBlock
                        data={response}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onEditHotspot={onEditHotspot}
                        onDeleteHotspot={onDeleteHotspot}
                        onPauseHotspot={onPauseHotspot}
                        onResumeHotspot={onResumeHotspot}
                        onLoadMore={onLoadMore}
                        isLoadingMore={isLoadingMore}
                        onViewLocationCollectors={onViewLocationCollectors}  // ← ADD
                        isSlate={isSlate}

                    />
                </div>
            );
    }
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({
    msg, intent,
    onAnswer, onConfirmWithOptions, onConfirmPins,
    onConfirmManagement, onDismiss,
    onEdit, onDelete, onEditHotspot, onDeleteHotspot,
    onPauseHotspot, onResumeHotspot,
    onLoadMore, isLoadingMore,
    isDropping, isLoading,
    onJobComplete, onListConfirm, onListDismiss,
    onViewLocationCollectors,
    isSlate
}: {
    msg: LocalChatMessage;
    intent: PinIntent;
    onAnswer: (msgId: string, answers: Record<string, string>) => void;
    onConfirmWithOptions: (options: PinOptions) => void;
    onConfirmPins: (pins: Pin[]) => void;
    onConfirmManagement: () => void;
    onDismiss: () => void;
    onEdit?: (ids: string[], fields: PinEditFields, scope?: HotspotScope, locationEdits?: Record<string, LocationEditFields>) => void;
    onDelete?: (ids: string[]) => void;
    onEditHotspot?: (hotspotId: string, fields: HotspotEditFields) => void;
    onDeleteHotspot?: (hotspotId: string) => void;
    onPauseHotspot?: (hotspotId: string) => void;
    onResumeHotspot?: (hotspotId: string) => void;
    onViewLocationCollectors: (locationId: string) => void;
    onLoadMore?: (nextOffset: number) => void;
    isLoadingMore?: boolean;
    isDropping: boolean;
    isLoading: boolean;
    onJobComplete: (count: number) => void;
    onListConfirm: (msgId: string, selectedIds: string[]) => void;
    onListDismiss: () => void;
    isSlate: boolean;
}) {
    const isUser = msg.role === "user";

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2.5`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-primary-foreground border-2 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-primary/20">
                    <Image src="/favicon.ico" alt="Agent" width={32} height={32} className="rounded-full" />
                </div>
            )}

            <div className={cn(
                "max-w-[60%] rounded-2xl px-4 py-3 text-sm h-full",
                isUser
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground border border-border rounded-bl-sm w-[60%]",
            )}>
                {msg.content.kind === "loading" && (
                    <TypingDots label={msg.content.label} />
                )}
                {msg.content.kind === "text" && (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content.text}</p>
                )}
                {msg.content.kind === "response" && (
                    <AgentResponseBlock
                        response={msg.content.data}
                        pins={msg.content.pins}
                        intent={intent}
                        mode={msg.content.mode}
                        onAnswer={(answers) => onAnswer(msg.id, answers)}
                        onConfirmWithOptions={onConfirmWithOptions}
                        onConfirmPins={onConfirmPins}
                        onConfirmManagement={onConfirmManagement}
                        onDismiss={onDismiss}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onEditHotspot={onEditHotspot}
                        onDeleteHotspot={onDeleteHotspot}
                        onPauseHotspot={onPauseHotspot}
                        onResumeHotspot={onResumeHotspot}
                        onViewLocationCollectors={onViewLocationCollectors}
                        onLoadMore={onLoadMore}
                        isLoadingMore={isLoadingMore}
                        isDropping={isDropping}
                        isLoading={isLoading}
                        questionAnswered={msg.content.questionAnswered}
                        questionAnsweredValues={msg.content.questionAnsweredValues}
                        resultsConfirmed={msg.content.resultsConfirmed}
                        resultsJobId={msg.content.resultsJobId}
                        onJobComplete={onJobComplete}
                        onListConfirm={(ids) => onListConfirm(msg.id, ids)}
                        onListDismiss={onListDismiss}
                        isSlate={isSlate}
                    />
                )}
            </div>

            {isUser && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold flex-shrink-0 mt-1">
                    U
                </div>
            )}
        </div>
    );
}

// ─── AgentBlockDisplayProps ───────────────────────────────────────────────────

export interface AgentBlockDisplayProps {
    // state
    messages: LocalChatMessage[];
    input: string;
    intent: PinIntent;
    stage: AgentStage;
    isLoading: boolean;
    isDropping: boolean;
    isOpen: boolean;
    isMinimized: boolean;
    isInteractionPending: boolean;
    isLoadingMore?: boolean;
    // setters
    setInput: (v: string) => void;
    setIsOpen: (v: boolean) => void;
    setIsMinimized: (v: boolean) => void;
    // handlers
    onSendMessage: (text: string, intentOverride?: Partial<PinIntent>) => void;
    onAnswer: (msgId: string, answers: Record<string, string>) => void;
    onConfirmWithOptions: (options: PinOptions) => void;
    onConfirmPins: (pins: Pin[]) => void;
    onDismiss: () => void;
    onReset: () => void;
    onEdit?: (ids: string[], fields: PinEditFields, scope?: HotspotScope, locationEdits?: Record<string, LocationEditFields>) => void;
    onDelete?: (ids: string[]) => void;
    onEditHotspot?: (hotspotId: string, fields: HotspotEditFields) => void;
    onDeleteHotspot?: (hotspotId: string) => void;
    onPauseHotspot?: (hotspotId: string) => void;
    onResumeHotspot?: (hotspotId: string) => void;
    onViewLocationCollectors: (locationId: string) => void;  // ← ADD
    onLoadMore?: (nextOffset: number) => void;
    onJobComplete: (count: number) => void;
    onListConfirm: (msgId: string, selectedIds: string[]) => void;
    onListDismiss: () => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    inputRef: React.RefObject<HTMLInputElement>;
}

// ─── AgentBlockDisplay ────────────────────────────────────────────────────────

export default function AgentBlockDisplay({
    messages, input, intent, stage, isLoading, isDropping,
    isOpen, isMinimized, isInteractionPending, isLoadingMore,
    setInput, setIsOpen, setIsMinimized,
    onSendMessage, onAnswer, onConfirmWithOptions, onConfirmPins,
    onDismiss, onReset,
    onEdit, onDelete, onEditHotspot, onDeleteHotspot,
    onPauseHotspot, onResumeHotspot,
    onLoadMore, onJobComplete,
    onListConfirm, onListDismiss,
    onViewLocationCollectors,
    onKeyDown, inputRef,
}: AgentBlockDisplayProps) {
    const isSlate = false;
    const bottomRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleConfirmManagement = useCallback(
        () => onSendMessage("Yes, confirm."),
        [onSendMessage],
    );

    const isEmpty = messages.length === 0;



    return (
        <>
            {/* ── Minimized pill ──────────────────────────────────────────────────── */}
            {isMinimized && (
                <button
                    onClick={() => { setIsMinimized(false); setIsOpen(true); }}
                    className="fixed bottom-12 left-1/2 z-40 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
                >
                    Wadzzo Assistant
                </button>
            )}

            {/* ── Input bar ───────────────────────────────────────────────────────── */}
            {!isMinimized && (
                <div className="fixed bottom-6 left-1/2 z-40 w-full max-w-2xl -translate-x-1/2 px-4">
                    <style>{`
            @keyframes neon-glow {
              0%, 100% { box-shadow: 0 0 5px rgba(34,197,94,.3), 0 0 10px rgba(34,197,94,.2); }
              50%       { box-shadow: 0 0 15px rgba(34,197,94,.6), 0 0 25px rgba(34,197,94,.4); }
            }
            .neon-bar { animation: neon-glow 3s ease-in-out infinite; border: 2px solid rgba(34,197,94,.5); }
          `}</style>
                    <div className="neon-bar flex items-center gap-2 rounded-full bg-white p-1 shadow-lg backdrop-blur-sm">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}

                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder="Ask me anything…"
                            disabled
                            // disabled={isLoading || isDropping || isInteractionPending}
                            className="flex-1 rounded-full bg-white px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                        />
                        <button
                            onClick={() => onSendMessage(input)}
                            disabled={!input.trim() || isLoading || isInteractionPending}
                            className="flex flex-shrink-0 items-center justify-center rounded-full bg-primary px-4 py-3 text-primary-foreground transition-all hover:scale-105 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {isLoading
                                ? <Loader2 className="h-5 w-5 animate-spin" />
                                : <Send className="h-5 w-5" />
                            }
                        </button>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="flex flex-shrink-0 items-center justify-center rounded-full bg-primary/80 px-4 py-3 text-primary-foreground transition-all hover:scale-105 active:scale-95"
                        >
                            <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isOpen ? "" : "rotate-180"}`} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Chat panel ──────────────────────────────────────────────────────── */}
            {!isMinimized && isOpen && (
                <div
                    className="fixed inset-x-0 bottom-24 z-40 mx-auto max-w-2xl rounded-2xl border border-border bg-background shadow-2xl animate-in slide-in-from-bottom-5 duration-300 flex flex-col"
                    style={{ height: "calc(100vh - 15vh)", maxHeight: "85vh" }}
                >
                    {/* Header */}
                    <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-primary text-primary-foreground rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-foreground flex items-center justify-center shadow-lg flex-shrink-0">
                                <Image src="/favicon.ico" alt="Wadzzo Icon" width={16} height={16} className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xs font-bold tracking-tight">Wadzzo Agent</h1>
                                <p className="text-[11px] text-white/70">
                                    {stage !== "idle" && stage !== "error"
                                        ? STAGE_LABEL[stage]
                                        : "AI Assistant"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={onReset}
                                title="Clear chat"
                                className="rounded-full p-2 transition-colors hover:bg-white/20"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => { setIsMinimized(true); setIsOpen(false); }}
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

                    <div className="flex flex-col  items-center justify-center h-full ">
                        ⚠️ This feature is currently under development and may not work as expected.
                    </div>

                    {/* Messages */}
                    {/* <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                        {isEmpty ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <div className="text-center space-y-2">
                                    <div className="text-5xl">🗺️</div>
                                    <h2 className="text-sm font-bold text-foreground">Wadzzo Agent</h2>
                                    <p className="text-muted-foreground text-xs leading-relaxed max-w-xs">
                                        Drop pins or manage your existing ones
                                    </p>
                                </div>
                                <div className="w-full max-w-sm space-y-2">
                                    {SUGGESTIONS.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => onSendMessage(s)}
                                            className="w-full px-3 py-2.5 rounded-lg text-xs text-left text-foreground bg-muted border border-border hover:border-primary/40 hover:bg-muted/80 transition-all duration-150"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                console.log("Rendering message", idx < messages.length - 1);
                                return (

                                    <MessageBubble
                                        key={msg.id}
                                        msg={msg}
                                        intent={intent}
                                        onAnswer={onAnswer}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onEditHotspot={onEditHotspot}
                                        onDeleteHotspot={onDeleteHotspot}
                                        onPauseHotspot={onPauseHotspot}
                                        onResumeHotspot={onResumeHotspot}
                                        onViewLocationCollectors={onViewLocationCollectors}
                                        onLoadMore={onLoadMore}
                                        isLoadingMore={isLoadingMore}
                                        onConfirmWithOptions={onConfirmWithOptions}
                                        onConfirmPins={onConfirmPins}
                                        onConfirmManagement={handleConfirmManagement}
                                        onDismiss={onDismiss}
                                        isDropping={isDropping}
                                        isLoading={isLoading}
                                        onJobComplete={onJobComplete}
                                        onListConfirm={onListConfirm}
                                        onListDismiss={onListDismiss}
                                        isSlate={idx < messages.length - 1}
                                    />

                                )
                            })
                        )}
                        <div ref={bottomRef} />
                    </div> */}
                </div>
            )}
        </>
    );
}