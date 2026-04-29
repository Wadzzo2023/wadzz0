"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    ShieldCheck,
    RefreshCw,
    Ticket,
    Clock,
    Users,
    ChevronRight,
    MapPin,
    Calendar,
    X,
    Loader2,
    Hash,
    Eye,
    Search,
    Landmark,
    PartyPopper,
    Filter,
} from "lucide-react";
import { Button } from "~/components/shadcn/ui/button";
import { Input } from "~/components/shadcn/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/shadcn/ui/avatar";
import Image from "next/image";
import { api } from "~/utils/api";
import { LocationAddressDisplay } from "~/components/maps/address-display";

// ─── Types ─────────────────────────────────────────────────────────────────────

type RedeemStatus = "success" | "already_redeemed" | "not_found" | "wrong_location";
type PinType = "LANDMARK" | "EVENT";

interface LocationGroup {
    id: string;
    title: string;
    description?: string | null;
    image?: string | null;
    link?: string | null;
    type: string;
    startDate: Date;
    endDate: Date;
    limit: number;
}

interface RedeemUser {
    name: string | null;
    image: string | null;
    email: string | null;
}

interface HistoryItem {
    id: string;
    redeemCode: string;
    redeemedAt: string | null;
    claimedAt: string | null;
    user: RedeemUser;
    location: LocationGroup;
    locationData: { latitude: number; longitude: number };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
    const map: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
        LANDMARK: {
            label: "Landmark",
            icon: <Landmark className="h-2.5 w-2.5" />,
            cls: "[background-color:hsl(var(--primary)/0.12)] [color:hsl(var(--primary))] [border-color:hsl(var(--primary)/0.25)]",
        },
        EVENT: {
            label: "Event",
            icon: <PartyPopper className="h-2.5 w-2.5" />,
            cls: "[background-color:hsl(var(--warning)/0.12)] [color:hsl(var(--warning))] [border-color:hsl(var(--warning)/0.3)]",
        },
    };
    const cfg = map[type] ?? map.LANDMARK;
    return (
        <span className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg?.cls}`}>
            {cfg?.icon}{cfg?.label}
        </span>
    );
}

// ─── Filter Bar ────────────────────────────────────────────────────────────────

interface FilterBarProps {
    search: string;
    onSearch: (v: string) => void;
    type: PinType | undefined;
    onType: (v: PinType | undefined) => void;
    total?: number;
    placeholder?: string;
}

function FilterBar({ search, onSearch, type, onType, total, placeholder }: FilterBarProps) {
    return (
        <div className="space-y-3">
            {/* Search input */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 [color:hsl(var(--muted-foreground))]" />
                <Input
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder={placeholder ?? "Search…"}
                    className="h-10 rounded-xl pl-10 pr-10 text-sm [background-color:hsl(var(--card)/0.5)] [border-color:hsl(var(--border)/0.2)] [color:hsl(var(--foreground))] placeholder:[color:hsl(var(--muted-foreground)/0.6)] focus-visible:ring-0 focus-visible:[border-color:hsl(var(--primary)/0.4)]"
                />
                {search && (
                    <button
                        onClick={() => onSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 transition-colors hover:[background-color:hsl(var(--muted)/0.4)] [color:hsl(var(--muted-foreground))]"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Type toggle pills */}
            <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 flex-shrink-0 [color:hsl(var(--muted-foreground))]" />
                <div className="flex gap-1.5">
                    {(["LANDMARK", "EVENT"] as PinType[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => onType(type === t ? undefined : t)}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all duration-150
                                ${type === t
                                    ? t === "LANDMARK"
                                        ? "border-transparent [background-color:hsl(var(--primary)/0.15)] [color:hsl(var(--primary))]"
                                        : "border-transparent [background-color:hsl(var(--warning)/0.15)] [color:hsl(var(--warning))]"
                                    : "[background-color:hsl(var(--card)/0.4)] [border-color:hsl(var(--border)/0.2)] [color:hsl(var(--muted-foreground))] hover:[color:hsl(var(--foreground))]"
                                }`}
                        >
                            {t === "LANDMARK" ? <Landmark className="h-3 w-3" /> : <PartyPopper className="h-3 w-3" />}
                            {t === "LANDMARK" ? "Landmarks" : "Events"}
                        </button>
                    ))}
                </div>
                {total !== undefined && (
                    <span className="ml-auto text-xs [color:hsl(var(--muted-foreground))]">
                        {total} result{total !== 1 ? "s" : ""}
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Infinite scroll sentinel ──────────────────────────────────────────────────

function InfiniteScrollSentinel({ onVisible, isLoading }: { onVisible: () => void; isLoading: boolean }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0]?.isIntersecting) onVisible(); },
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [onVisible]);

    return (
        <div ref={ref} className="flex justify-center py-4">
            {isLoading && <Loader2 className="h-5 w-5 animate-spin [color:hsl(var(--muted-foreground))]" />}
        </div>
    );
}

// ─── Pre-Redeem Confirmation Modal ────────────────────────────────────────────

interface PreRedeemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
    consumer: {
        user: RedeemUser;
        location: LocationGroup;
        locationData: { latitude: number; longitude: number };
        claimedAt?: string | null;
        redeemCode: string;
    } | null;
}

function PreRedeemModal({ isOpen, onClose, onConfirm, isLoading, consumer }: PreRedeemModalProps) {
    if (!consumer) return null;
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 backdrop-blur-sm [background-color:hsl(0_0%_0%/0.55)]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 8 }}
                        transition={{ type: "spring", stiffness: 300, damping: 24 }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    >
                        <div className="w-full max-w-xl overflow-hidden rounded-3xl border shadow-2xl [background-color:hsl(var(--card))] [border-color:hsl(var(--border)/0.2)]">
                            <div className="flex items-center justify-between border-b px-6 py-4 [border-color:hsl(var(--border)/0.1)]">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest [color:hsl(var(--muted-foreground))]">Confirm Redemption</p>
                                    <h2 className="text-base font-black [color:hsl(var(--foreground))]">Review before redeeming</h2>
                                </div>
                                <button onClick={onClose} className="rounded-lg p-1.5 [color:hsl(var(--muted-foreground))] hover:[background-color:hsl(var(--muted)/0.3)]">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="space-y-4 p-6">
                                {/* User */}
                                <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 [background-color:hsl(var(--muted)/0.15)] [border-color:hsl(var(--border)/0.15)]">
                                    <Avatar className="h-11 w-11 border-2 [border-color:hsl(var(--primary)/0.3)]">
                                        <AvatarImage src={consumer.user.image ?? ""} />
                                        <AvatarFallback className="text-sm font-black [background-color:hsl(var(--primary)/0.15)] [color:hsl(var(--primary))]">
                                            {consumer.user.name?.[0]?.toUpperCase() ?? "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold [color:hsl(var(--foreground))]">{consumer.user.name ?? "Unknown"}</p>
                                        <p className="truncate text-xs [color:hsl(var(--muted-foreground))]">{consumer.user.email}</p>
                                        {consumer.claimedAt && (
                                            <p className="mt-0.5 flex items-center gap-1 text-[10px] [color:hsl(var(--muted-foreground))]">
                                                <Clock className="h-2.5 w-2.5" />
                                                Claimed {new Date(consumer.claimedAt).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {/* Location group */}
                                <div className="rounded-2xl border p-3 [background-color:hsl(var(--muted)/0.1)] [border-color:hsl(var(--border)/0.15)]">
                                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest [color:hsl(var(--muted-foreground))]">Location Group</p>
                                    <div className="flex items-start gap-3">
                                        {consumer.location.image ? (
                                            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl">
                                                <img src={consumer.location.image} alt={consumer.location.title} className="object-cover" onError={(e) => { e.currentTarget.src = "/images/logo.png" }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl [background-color:hsl(var(--primary)/0.1)]">
                                                <MapPin className="h-5 w-5 [color:hsl(var(--primary))]" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-bold [color:hsl(var(--foreground))]">{consumer.location.title}</p>
                                                <TypeBadge type={consumer.location.type} />
                                            </div>
                                            {consumer.location.description && (
                                                <p className="line-clamp-2 text-xs [color:hsl(var(--muted-foreground))]">{consumer.location.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Pin location */}
                                <div className="rounded-2xl border p-3 [background-color:hsl(var(--muted)/0.1)] [border-color:hsl(var(--border)/0.15)]">
                                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest [color:hsl(var(--muted-foreground))]">Pin Location</p>
                                    <div className="flex flex-col gap-1.5">
                                        <LocationAddressDisplay latitude={consumer.locationData.latitude} longitude={consumer.locationData.longitude} />
                                        <span className="font-mono text-xs [color:hsl(var(--muted-foreground))]">
                                            {consumer.locationData.latitude.toFixed(5)}, {consumer.locationData.longitude.toFixed(5)}
                                        </span>
                                    </div>
                                </div>
                                {/* Code */}
                                <div className="flex items-center justify-between rounded-xl border px-4 py-2.5 [background-color:hsl(var(--muted)/0.1)] [border-color:hsl(var(--border)/0.15)]">
                                    <span className="flex items-center gap-1.5 text-xs [color:hsl(var(--muted-foreground))]"><Hash className="h-3 w-3" /> Code</span>
                                    <span className="font-mono text-sm font-black tracking-widest [color:hsl(var(--foreground))]">{consumer.redeemCode}</span>
                                </div>
                            </div>
                            <div className="flex gap-3 border-t px-6 py-4 [border-color:hsl(var(--border)/0.1)]">
                                <Button variant="ghost" onClick={onClose} className="h-11 flex-1 rounded-2xl text-sm font-semibold [color:hsl(var(--muted-foreground))] hover:[background-color:hsl(var(--muted)/0.3)]">
                                    Cancel
                                </Button>
                                <Button onClick={onConfirm} disabled={isLoading} className="h-11 flex-1 rounded-2xl text-sm font-bold [background-color:hsl(var(--primary))] [color:hsl(var(--primary-foreground))] hover:[background-color:hsl(var(--primary)/0.9)]">
                                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redeeming…</> : <><ShieldCheck className="mr-2 h-4 w-4" /> Confirm Redeem</>}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ─── Redeem status inline result ──────────────────────────────────────────────

const STATUS_UI: Record<RedeemStatus, { icon: React.ReactNode; label: string; cls: string }> = {
    success: {
        icon: <CheckCircle2 className="h-4 w-4" strokeWidth={2} />,
        label: "Redeemed successfully!",
        cls: "[background-color:hsl(var(--success)/0.1)] [border-color:hsl(var(--success)/0.3)] [color:hsl(var(--success))]",
    },
    already_redeemed: {
        icon: <AlertCircle className="h-4 w-4" strokeWidth={2} />,
        label: "Already redeemed",
        cls: "[background-color:hsl(var(--warning)/0.1)] [border-color:hsl(var(--warning)/0.3)] [color:hsl(var(--warning))]",
    },
    not_found: {
        icon: <XCircle className="h-4 w-4" strokeWidth={2} />,
        label: "Code not found",
        cls: "[background-color:hsl(var(--destructive)/0.1)] [border-color:hsl(var(--destructive)/0.3)] [color:hsl(var(--destructive))]",
    },
    wrong_location: {
        icon: <AlertCircle className="h-4 w-4" strokeWidth={2} />,
        label: "Code belongs to different location",
        cls: "[background-color:hsl(var(--warning)/0.1)] [border-color:hsl(var(--warning)/0.3)] [color:hsl(var(--warning))]",
    },
};

// ─── Location Row ──────────────────────────────────────────────────────────────
// ─── Location Row ──────────────────────────────────────────────────────────────
// Drop-in replacement for the existing LocationRow + GroupCard components.
// Everything else in the file (types, helpers, FilterBar, modals, tabs, page) stays the same.

interface LocationRowProps {
    location: {
        id: string;
        latitude: number;
        longitude: number;
        consumers: {
            id: string;
            redeemCode: string;
            isRedeemed: boolean;
            redeemedAt: string | null;
            claimedAt: string | null;
            user: RedeemUser;
        }[];
    };
    locationGroup: LocationGroup;
}

interface LocationRowProps {
    location: {
        id: string;
        latitude: number;
        longitude: number;
        consumers: {
            id: string;
            redeemCode: string;
            isRedeemed: boolean;
            redeemedAt: string | null;
            claimedAt: string | null;
            user: RedeemUser;
        }[];
    };
    locationGroup: LocationGroup;
}

function LocationRow({ location, locationGroup }: LocationRowProps) {
    const [code, setCode] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [previewData, setPreviewData] = useState<PreRedeemModalProps["consumer"]>(null);
    const [resultStatus, setResultStatus] = useState<RedeemStatus | null>(null);
    const [lookupError, setLookupError] = useState<string | null>(null);

    const lookupMutation = api.maps.pin.lookupRedeemCode.useMutation({
        onSuccess: (data) => {
            if (data.status === "not_found") {
                setLookupError("Code not found.");
                return;
            }
            if (data.status === "wrong_location") {
                const locationName = data.actualLocation?.groupTitle ?? "another location";
                setLookupError(`This code belongs to ${locationName}, not this location.`);
                return;
            }
            if (data.status === "already_redeemed") {
                setResultStatus("already_redeemed");
                return;
            }
            setPreviewData({
                user: data.user,
                location: locationGroup,
                locationData: { latitude: location.latitude, longitude: location.longitude },
                claimedAt: data.claimedAt,
                redeemCode: code.trim().toUpperCase(),
            });
            setShowModal(true);
        },
        onError: () => setLookupError("Something went wrong. Try again."),
    });

    const redeemMutation = api.maps.pin.redeemByCode.useMutation({
        onSuccess: (data) => { setResultStatus(data.status as RedeemStatus); setShowModal(false); setCode(""); },
        onError: () => { setResultStatus("not_found"); setShowModal(false); },
    });

    const handleLookup = () => {
        const clean = code.trim().toUpperCase();
        if (clean.length !== 6) return;
        setLookupError(null);
        setResultStatus(null);
        lookupMutation.mutate({ code: clean, locationId: location.id });
    };

    const handleReset = () => {
        setCode(""); setResultStatus(null); setLookupError(null);
        lookupMutation.reset(); redeemMutation.reset();
    };
    const limit = locationGroup.limit;
    const totalConsumers = location.consumers.length;
    const redeemedCount = location.consumers.filter((c) => c.isRedeemed).length;
    const progressPct = totalConsumers > 0 ? Math.round((redeemedCount / limit) * 100) : 0;

    return (
        <>
            {/* Ticket card */}
            <div className="relative flex overflow-hidden rounded-2xl border [background-color:hsl(var(--card))] [border-color:hsl(var(--border)]">

                {/* ── Dashed divider + notch circles ── */}
                <div className="pointer-events-none absolute inset-y-0 left-[55%] z-10 flex flex-col items-center">
                    {/* Top notch */}
                    <div className="h-3 w-3 -translate-x-[5px] -translate-y-1.5 rounded-full border [background-color:hsl(var(--background))] [border-color:hsl(var(--border))]" />
                    {/* Dashed line */}
                    <div className="flex-1 border-l-[1.5px] border-dashed [border-color:hsl(var(--border)]" />
                    {/* Bottom notch */}
                    <div className="h-3 w-3 -translate-x-[5px] translate-y-1.5 rounded-full border [background-color:hsl(var(--background))] [border-color:hsl(var(--border)]" />
                </div>

                {/* ── LEFT COLUMN — info ── */}
                <div className="flex w-[55%] flex-col gap-3 p-4 pr-6">

                    {/* Address */}
                    <div>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest [color:hsl(var(--muted-foreground))]">Pin location</p>
                        <LocationAddressDisplay latitude={location.latitude} longitude={location.longitude} />
                        <p className="mt-0.5 font-mono text-[10px] [color:hsl(var(--muted-foreground)/0.7)]">
                            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </p>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border px-3 py-2 [background-color:hsl(var(--card)/0.6)] [border-color:hsl(var(--border)/0.15)]">
                            <p className="text-base font-black [color:hsl(var(--success))]">{redeemedCount}</p>
                            <p className="text-[10px] uppercase tracking-wide [color:hsl(var(--muted-foreground))]">Redeemed</p>
                        </div>

                        <div className="rounded-xl border px-3 py-2 [background-color:hsl(var(--card)/0.6)] [border-color:hsl(var(--border)/0.15)]">
                            <p className="text-base font-black [color:hsl(var(--foreground))]">{limit}</p>
                            <p className="text-[10px] uppercase tracking-wide [color:hsl(var(--muted-foreground))]">Limit</p>
                        </div>

                    </div>

                    {/* Progress bar */}
                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-widest [color:hsl(var(--muted-foreground))]">Progress</p>
                            <p className="text-[10px] font-black [color:hsl(var(--foreground)/0.6)]">{progressPct}%</p>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full [background-color:hsl(var(--border))]">
                            <div
                                className="h-full rounded-full [background-color:hsl(var(--success))]"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN — redeem input ── */}
                <div className="flex w-[45%] flex-col justify-center gap-3 p-4 pl-6">

                    <AnimatePresence mode="wait">
                        {resultStatus ? (
                            <motion.div key="result" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                                <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${STATUS_UI[resultStatus].cls}`}>
                                    {STATUS_UI[resultStatus].icon}
                                    <span className="text-xs font-semibold">{STATUS_UI[resultStatus].label}</span>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs [background-color:hsl(var(--card)/0.5)] [border-color:hsl(var(--border)/0.2)] [color:hsl(var(--muted-foreground))] hover:[color:hsl(var(--foreground))]"
                                >
                                    <RefreshCw className="h-3 w-3" /> Try another
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
                                <p className="text-center text-[10px] font-bold uppercase tracking-widest [color:hsl(var(--muted-foreground))]">Redeem code</p>

                                {/* Code input */}
                                <Input
                                    value={code}
                                    onChange={(e) => {
                                        setLookupError(null);
                                        setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
                                    }}
                                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                                    placeholder="— — — — — —"
                                    maxLength={6}
                                    className="h-12 w-full rounded-xl text-center font-mono text-xl font-black tracking-[0.2em] [background-color:hsl(var(--input)/0.5)] [border-color:hsl(var(--border)/0.25)] [color:hsl(var(--foreground))] placeholder:text-base placeholder:tracking-normal placeholder:[color:hsl(var(--muted-foreground)/0.4)] focus-visible:ring-0 focus-visible:[border-color:hsl(var(--primary)/0.5)]"
                                />

                                {/* Char dots */}
                                <div className="flex justify-center gap-1.5">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1.5 w-1.5 rounded-full transition-all duration-100 ${i < code.length
                                                ? code.length === 6
                                                    ? "[background-color:hsl(var(--success))]"
                                                    : "[background-color:hsl(var(--primary))]"
                                                : "[background-color:hsl(var(--border)/0.4)]"
                                                }`}
                                        />
                                    ))}
                                </div>

                                {/* Preview button */}
                                <Button
                                    onClick={handleLookup}
                                    disabled={code.length !== 6 || lookupMutation.isLoading}
                                    className="h-10 w-full rounded-xl text-xs font-bold [background-color:hsl(var(--primary))] [color:hsl(var(--primary-foreground))] disabled:[background-color:hsl(var(--muted))] disabled:[color:hsl(var(--muted-foreground))]"
                                >
                                    {lookupMutation.isLoading
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        : <><Eye className="mr-1.5 h-3.5 w-3.5" />Preview</>}
                                </Button>

                                {/* Error */}
                                <AnimatePresence>
                                    {lookupError && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            className="flex items-center justify-center gap-1.5 text-xs [color:hsl(var(--destructive))]"
                                        >
                                            <XCircle className="h-3.5 w-3.5" />{lookupError}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <PreRedeemModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={() => redeemMutation.mutate({ code: code.trim().toUpperCase() })}
                isLoading={redeemMutation.isLoading}
                consumer={previewData}
            />
        </>
    );
}


// ─── Location Group Accordion ─────────────────────────────────────────────────
// Updated GroupCard — adds totalConsumers/totalRedeemed/pendingCount to header stats.

interface GroupCardProps {
    group: {
        id: string;
        title: string;
        description?: string | null;
        image?: string | null;
        link?: string | null;
        type: string;
        startDate: Date;
        endDate: Date;
        limit: number;
        totalConsumers: number;
        totalRedeemed: number;
        latestConsumerAt?: string | null;
        locations: LocationRowProps["location"][];
    };
}

function GroupCard({ group }: GroupCardProps) {
    const [expanded, setExpanded] = useState(false);




    return (
        <motion.div layout className="overflow-hidden rounded-3xl border [background-color:hsl(var(--card)/0.5)] [border-color:hsl(var(--border)/0.2)]">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:[background-color:hsl(var(--card)/0.8)]"
            >
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl [background-color:hsl(var(--muted)/0.3)]">
                    {group.image ? (
                        <img src={group.image} alt={group.title} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = "/favicon.ico"; }} />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            {group.type === "EVENT"
                                ? <PartyPopper className="h-6 w-6 [color:hsl(var(--muted-foreground)/0.4)]" />
                                : <Landmark className="h-6 w-6 [color:hsl(var(--muted-foreground)/0.4)]" />}
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black [color:hsl(var(--foreground))]">{group.title}</span>
                        <TypeBadge type={group.type} />
                    </div>

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs [color:hsl(var(--muted-foreground))]">

                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(group.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                    </div>


                </div>

                <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight className="h-5 w-5 flex-shrink-0 [color:hsl(var(--muted-foreground))]" />
                </motion.div>
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-3 border-t px-5 pb-5 pt-4 [border-color:hsl(var(--border)/0.1)]">
                            <p className="text-xs font-bold uppercase tracking-widest [color:hsl(var(--muted-foreground))]">
                                Locations · {group.locations.length}
                            </p>
                            {group.locations.map((loc) => (
                                <LocationRow key={loc.id} location={loc} locationGroup={group} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Location Group Accordion ─────────────────────────────────────────────────

interface GroupCardProps {
    group: {
        id: string;
        title: string;
        description?: string | null;
        image?: string | null;
        link?: string | null;
        type: string;
        limit: number;
        startDate: Date;
        endDate: Date;
        totalConsumers: number;
        totalRedeemed: number;
        latestConsumerAt?: string | null;
        locations: LocationRowProps["location"][];
    };
}

// ─── Tab: Redeem ───────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

function RedeemTab() {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<PinType | undefined>(undefined);
    const debouncedSearch = useDebounce(search, 300);

    const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
        api.maps.pin.getLocationGroupsWithConsumers.useInfiniteQuery(
            { search: debouncedSearch || undefined, type: typeFilter, limit: 10 },
            {
                getNextPageParam: (lastPage) => lastPage.nextCursor,
                keepPreviousData: true,
            }
        );

    const allGroups = data?.pages.flatMap((p) => p.items) ?? [];
    const total = data?.pages[0]?.total;
    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (isLoading) {
        return (
            <div className="space-y-3">
                <FilterBar search={search} onSearch={setSearch} type={typeFilter} onType={setTypeFilter} placeholder="Search location groups…" />
                <div className="flex flex-col items-center justify-center gap-3 py-20">
                    <Loader2 className="h-8 w-8 animate-spin [color:hsl(var(--muted-foreground))]" />
                    <p className="text-sm [color:hsl(var(--muted-foreground))]">Loading your pins…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 ">
            <FilterBar
                search={search}
                onSearch={setSearch}
                type={typeFilter}
                onType={setTypeFilter}
                total={total}
                placeholder="Search location groups…"
            />

            {allGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl border [background-color:hsl(var(--card)/0.5)] [border-color:hsl(var(--border)/0.3)]">
                        {typeFilter === "EVENT" ? <PartyPopper className="h-7 w-7 [color:hsl(var(--muted-foreground))]" /> : <Landmark className="h-7 w-7 [color:hsl(var(--muted-foreground))]" />}
                    </div>
                    <div>
                        <p className="text-sm font-bold [color:hsl(var(--foreground))]">
                            {search ? `No results for "${search}"` : "No location groups"}
                        </p>
                        <p className="mt-1 text-xs [color:hsl(var(--muted-foreground))]">
                            {search ? "Try a different search term." : "Create a Landmark or Event pin group to get started."}
                        </p>
                    </div>
                    {search && (
                        <button onClick={() => setSearch("")} className="text-xs underline [color:hsl(var(--primary))]">
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {allGroups.map((group) => (
                        <GroupCard key={group.id} group={group} />
                    ))}

                    {hasNextPage && (
                        <InfiniteScrollSentinel onVisible={handleLoadMore} isLoading={isFetchingNextPage} />
                    )}

                    {!hasNextPage && allGroups.length > 0 && (
                        <p className="py-4 text-center text-xs [color:hsl(var(--muted-foreground)/0.5)]">
                            All {allGroups.length} group{allGroups.length !== 1 ? "s" : ""} loaded
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Tab: History ──────────────────────────────────────────────────────────────

function HistoryDetailModal({ item, isOpen, onClose }: { item: HistoryItem | null; isOpen: boolean; onClose: () => void }) {
    if (!item) return null;
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 backdrop-blur-sm [background-color:hsl(0_0%_0%/0.5)]" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border shadow-2xl [background-color:hsl(var(--card))] [border-color:hsl(var(--border)/0.2)]">
                            <div className="sticky top-0 flex items-center justify-between border-b px-6 py-4 [background-color:hsl(var(--card))] [border-color:hsl(var(--border)/0.1)]">
                                <h2 className="text-sm font-black [color:hsl(var(--foreground))]">Redemption Details</h2>
                                <button onClick={onClose} className="[color:hsl(var(--muted-foreground))] hover:[color:hsl(var(--foreground))]"><X className="h-4 w-4" /></button>
                            </div>
                            <div className="space-y-4 p-6">
                                <div>
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest [color:hsl(var(--muted-foreground))]">Code</p>
                                    <div className="rounded-xl border px-4 py-2.5 font-mono text-sm font-black tracking-widest [background-color:hsl(var(--muted)/0.15)] [border-color:hsl(var(--border)/0.2)] [color:hsl(var(--foreground))]">{item.redeemCode}</div>
                                </div>
                                <div>
                                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest [color:hsl(var(--muted-foreground))]">Consumer</p>
                                    <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 [background-color:hsl(var(--muted)/0.1)] [border-color:hsl(var(--border)/0.15)]">
                                        <Avatar className="h-10 w-10 border [border-color:hsl(var(--border)/0.6)]">
                                            <AvatarImage src={item.user.image ?? ""} />
                                            <AvatarFallback className="text-xs font-black [background-color:hsl(var(--primary)/0.1)] [color:hsl(var(--primary))]">{item.user.name?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold [color:hsl(var(--foreground))]">{item.user.name ?? "Unknown"}</p>
                                            <p className="truncate text-xs [color:hsl(var(--muted-foreground))]">{item.user.email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest [color:hsl(var(--muted-foreground))]">Location Group</p>
                                    <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 [background-color:hsl(var(--muted)/0.1)] [border-color:hsl(var(--border)/0.15)]">
                                        {item.location.image && (
                                            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl">
                                                <img src={item.location.image} alt={item.location.title} className="object-cover" onError={(e) => { e.currentTarget.src = "/images/logo.png" }} />
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-bold [color:hsl(var(--foreground))]">{item.location.title}</p>
                                            <TypeBadge type={item.location.type} />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest [color:hsl(var(--muted-foreground))]">Pin Location</p>
                                    <div className="space-y-1.5 rounded-2xl border px-4 py-3 [background-color:hsl(var(--muted)/0.1)] [border-color:hsl(var(--border)/0.15)]">
                                        <LocationAddressDisplay latitude={item.locationData.latitude} longitude={item.locationData.longitude} />
                                        <p className="font-mono text-xs [color:hsl(var(--muted-foreground))]">{item.locationData.latitude.toFixed(5)}, {item.locationData.longitude.toFixed(5)}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {item.claimedAt && (
                                        <div className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs [background-color:hsl(var(--muted)/0.1)] [border-color:hsl(var(--border)/0.15)]">
                                            <span className="flex items-center gap-1.5 [color:hsl(var(--muted-foreground))]"><MapPin className="h-3 w-3" /> Claimed</span>
                                            <span className="font-semibold [color:hsl(var(--foreground))]">{new Date(item.claimedAt).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {item.redeemedAt && (
                                        <div className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs [background-color:hsl(var(--success)/0.08)] [border-color:hsl(var(--success)/0.2)]">
                                            <span className="flex items-center gap-1.5 [color:hsl(var(--success))]"><CheckCircle2 className="h-3 w-3" /> Redeemed</span>
                                            <span className="font-semibold [color:hsl(var(--foreground))]">{new Date(item.redeemedAt).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function HistoryTab() {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<PinType | undefined>(undefined);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const debouncedSearch = useDebounce(search, 300);

    const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
        api.maps.pin.getRedeemedByCreator.useInfiniteQuery(
            { search: debouncedSearch || undefined, type: typeFilter, limit: 10 },
            {
                getNextPageParam: (lastPage) => lastPage.nextCursor,
                keepPreviousData: true,
            }
        );
    console.log({ data })
    const allItems = data?.pages.flatMap((p) => p.items) ?? [];
    const total = data?.pages[0]?.total;

    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Group rendered items by location group
    const grouped = allItems.reduce<Record<string, { group: LocationGroup; items: HistoryItem[] }>>((acc, item) => {
        const gid = item.location?.id;
        if (!acc[gid]) acc[gid] = { group: item.location, items: [] };
        acc[gid].items.push(item);
        return acc;
    }, {});



    if (isLoading) {
        return (
            <div className="space-y-3">
                <FilterBar search={search} onSearch={setSearch} type={typeFilter} onType={setTypeFilter} placeholder="Search by name, email, code, or group…" />
                <div className="flex flex-col items-center justify-center gap-3 py-20">
                    <Loader2 className="h-8 w-8 animate-spin [color:hsl(var(--muted-foreground))]" />
                    <p className="text-sm [color:hsl(var(--muted-foreground))]">Loading history…</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                <FilterBar
                    search={search}
                    onSearch={setSearch}
                    type={typeFilter}
                    onType={setTypeFilter}
                    total={total}
                    placeholder="Search by name, email, code, or group…"
                />

                {allItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl border [background-color:hsl(var(--card)/0.5)] [border-color:hsl(var(--border)/0.3)]">
                            <Users className="h-7 w-7 [color:hsl(var(--muted-foreground))]" />
                        </div>
                        <div>
                            <p className="text-sm font-bold [color:hsl(var(--foreground))]">
                                {search ? `No results for "${search}"` : "No redemptions yet"}
                            </p>
                            <p className="mt-1 text-xs [color:hsl(var(--muted-foreground))]">
                                {search ? "Try adjusting your search or filter." : "Redeemed rewards will appear here."}
                            </p>
                        </div>
                        {search && (
                            <button onClick={() => setSearch("")} className="text-xs underline [color:hsl(var(--primary))]">Clear search</button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.values(grouped).map(({ group, items }) => (
                            <div key={group.id} className="overflow-hidden rounded-3xl border [background-color:hsl(var(--card)/0.4)] [border-color:hsl(var(--border)/0.2)]">
                                {/* Group header */}
                                <div className="flex items-center gap-3 border-b px-5 py-4 [border-color:hsl(var(--border)/0.1)]">
                                    {group.image ? (
                                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl">
                                            <img src={group.image} alt={group.title} className="object-cover"
                                                onError={(e) => { e.currentTarget.src = "/images/logo.png" }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl [background-color:hsl(var(--primary)/0.1)]">
                                            {group.type === "EVENT"
                                                ? <PartyPopper className="h-4 w-4 [color:hsl(var(--accent))]" />
                                                : <Landmark className="h-4 w-4 [color:hsl(var(--primary))]" />}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-black [color:hsl(var(--foreground))]">{group.title}</p>
                                            <TypeBadge type={group.type} />
                                        </div>
                                        <p className="text-xs [color:hsl(var(--muted-foreground))]">{items.length} redemption{items.length !== 1 ? "s" : ""}</p>
                                    </div>
                                </div>
                                {/* Rows */}
                                <div className="divide-y [divide-color:hsl(var(--border)/0.08)]">
                                    {items.map((item, i) => (
                                        <motion.button
                                            key={item.id}
                                            onClick={() => { setSelectedItem(item); setIsDetailOpen(true); }}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:[background-color:hsl(var(--card)/0.8)]"
                                        >
                                            <Avatar className="h-9 w-9 flex-shrink-0 border [border-color:hsl(var(--border)/0.4)]">
                                                <AvatarImage src={item.user?.image ?? ""} />
                                                <AvatarFallback className="text-xs font-black [background-color:hsl(var(--primary)/0.1)] [color:hsl(var(--primary))]">
                                                    {item.user?.name?.[0]?.toUpperCase() ?? "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold [color:hsl(var(--foreground))]">{item.user?.name ?? "Unknown"}</p>
                                                <p className="truncate text-xs [color:hsl(var(--muted-foreground))]">{item.user?.email}</p>
                                            </div>
                                            <div className="flex flex-shrink-0 flex-col items-end gap-1">
                                                <span className="font-mono text-xs font-black tracking-widest [color:hsl(var(--foreground)/0.7)]">{item.redeemCode}</span>
                                                <span className="flex items-center gap-1 text-[10px] [color:hsl(var(--success))]">
                                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                                    {item.redeemedAt ? new Date(item.redeemedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                                                </span>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {hasNextPage && (
                            <InfiniteScrollSentinel onVisible={handleLoadMore} isLoading={isFetchingNextPage} />
                        )}

                        {!hasNextPage && allItems.length > 0 && (
                            <p className="py-4 text-center text-xs [color:hsl(var(--muted-foreground)/0.5)]">
                                All {allItems.length} redemption{allItems.length !== 1 ? "s" : ""} loaded
                            </p>
                        )}
                    </div>
                )}
            </div>

            <HistoryDetailModal
                item={selectedItem}
                isOpen={isDetailOpen}
                onClose={() => { setIsDetailOpen(false); setSelectedItem(null); }}
            />
        </>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

const RedeemPage = () => {
    const [tab, setTab] = useState<"redeem" | "history">("redeem");

    return (
        <div className="min-h-screen [background-color:hsl(var(--card)/0.5)]" >
            <div className="pointer-events-none fixed inset-0 [background-image:radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.05),transparent)]" />

            <div className="mx-auto max-w-3xl px-5 pb-16">
                {/* Tabs */}
                <motion.div
                    className="my-6 flex gap-1 rounded-2xl border p-1 [background-color:hsl(var(--secondary)/0.5)] [border-color:hsl(var(--border)/0.15)]"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {(["redeem", "history"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all duration-200
                                ${tab === t
                                    ? "shadow-sm [background-color:hsl(var(--primary))] [color:hsl(var(--background))]"
                                    : "[color:hsl(var(--muted-foreground))] hover:[color:hsl(var(--foreground)/0.8)]"
                                }`}
                        >
                            {t === "redeem" ? <><Ticket className="h-4 w-4" /> Redeem</> : <><Users className="h-4 w-4" /> History</>}
                        </button>
                    ))}
                </motion.div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                    >
                        {tab === "redeem" ? <RedeemTab /> : <HistoryTab />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default RedeemPage;