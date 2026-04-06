import { Button } from "~/components/shadcn/ui/button";
import { Dialog, DialogContent } from "~/components/shadcn/ui/dialog";
import { NavigationControl, Map, Marker } from "react-map-gl";
import {
    CalendarClock,
    CalendarDays,
    FileText,
    Hash,
    Layers3,
    Link2,
    MapPinned,
    MapPin,
    Radar,
    ShieldCheck,
} from "lucide-react";

import { z } from "zod";
import { CardFooter } from "~/components/shadcn/ui/card";
import { useModal } from "~/lib/state/play/use-modal-store";
import { Badge } from "~/components/shadcn/ui/badge";

export const PaymentMethodEnum = z.enum(["asset", "xlm", "card"]);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_API ?? "";

export default function PinInfoModal() {
    const { onClose, isOpen, type, data } = useModal();
    const isModalOpen = isOpen && type === "pin info modal";
    const handleClose = () => {
        onClose();
    };

    if (!data.collectedPinInfo) return null;

    const { collectedPinInfo: pin } = data;

    return (
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border border-black/12 bg-white/95 p-0 shadow-[0_24px_80px_rgba(15,23,42,0.2)] backdrop-blur-[6px] [&>button]:hidden">
                <div className="space-y-4">
                    <div className="sticky top-0 z-20 h-56 md:h-64">
                        <div className="relative h-full w-full">
                            <div className="absolute inset-0 overflow-hidden">
                                {MAPBOX_TOKEN ? (
                                    <Map
                                        mapboxAccessToken={MAPBOX_TOKEN}
                                        initialViewState={{
                                            latitude: pin.location.latitude,
                                            longitude: pin.location.longitude,
                                            zoom: 13.6,
                                            pitch: 42,
                                            bearing: -18,
                                        }}
                                        mapStyle="mapbox://styles/mapbox/light-v11"
                                        reuseMaps
                                        style={{ width: "100%", height: "100%" }}
                                    >
                                        <NavigationControl position="top-right" />
                                        <Marker
                                            latitude={pin.location.latitude}
                                            longitude={pin.location.longitude}
                                            anchor="bottom"
                                        >
                                            <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-[#1f86ee] text-white shadow-lg">
                                                <MapPin className="h-4 w-4" />
                                            </div>
                                        </Marker>
                                    </Map>
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#dbe8ff] via-[#c9ddff] to-[#b7d0ff]">
                                        <p className="text-sm font-medium text-black/70">
                                            Map preview unavailable (missing Mapbox token)
                                        </p>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    <div className="space-y-5 px-5">
                        <div className="flex min-h-[40px] items-center justify-between gap-3">
                            <div>
                                {pin.location.locationGroup?.image ? (
                                    <div className="rounded-xl border border-black/10 bg-white p-1 shadow-[0_10px_22px_-18px_rgba(0,0,0,0.6)]">
                                        <img
                                            src={pin.location.locationGroup.image}
                                            alt={pin.location.locationGroup.title}
                                            className="h-9 w-9 rounded-md object-cover"
                                        />
                                    </div>
                                ) : null}
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={pin.location.locationGroup?.multiPin ? "secondary" : "outline"}>
                                    {pin.location.locationGroup?.multiPin ? "Multi-Pin" : "Single-Pin"}
                                </Badge>
                                <Badge variant={pin.location.locationGroup?.pageAsset ? "secondary" : "outline"}>
                                    {pin.location.locationGroup?.pageAsset ? "Page Asset" : "Regular Asset"}
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-[1.45rem] font-semibold tracking-tight text-black">
                                {pin.location.locationGroup?.title}
                            </h2>
                            <p className="text-sm text-black/55">
                                ID {pin.location?.locationGroupId?.slice(0, 12)}...
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="rounded-[26px] border border-black/8 bg-white/85 p-5">
                                <div className="mb-4 flex items-start justify-between">
                                    <span className="grid h-10 w-10 place-items-center rounded-full bg-black/[0.05]">
                                        <Hash className="h-5 w-5" />
                                    </span>
                                </div>
                                <p className="text-[1.02rem] font-semibold text-black/85">Pin ID</p>
                                <p className="mt-1 text-[0.95rem] leading-6 text-black/80">
                                    {pin.location?.locationGroupId?.slice(0, 10) + "..."}
                                </p>
                            </div>
                            <div className="rounded-[26px] border border-black/8 bg-white/85 p-5">
                                <div className="mb-4 flex items-start justify-between">
                                    <span className="grid h-10 w-10 place-items-center rounded-full bg-black/[0.05]">
                                        <ShieldCheck className="h-5 w-5" />
                                    </span>
                                </div>
                                <p className="text-[1.02rem] font-semibold text-black/85">Privacy</p>
                                <p className="mt-1 text-[0.95rem] uppercase leading-6 text-black/80">
                                    {pin.location.locationGroup?.privacy}
                                </p>
                            </div>
                            <div className="rounded-[26px] border border-black/8 bg-white/85 p-4">
                                <div className="mb-4 flex items-start justify-between">
                                    <span className="grid h-10 w-10 place-items-center rounded-full bg-black/[0.05]">
                                        <MapPinned className="h-5 w-5" />
                                    </span>
                                </div>
                                <p className="text-[1.02rem] font-semibold text-black/85">Coordinates</p>
                                <p className="mt-1 text-[0.95rem] text-black/75">
                                    {pin.location.latitude.toFixed(5)}, {pin.location.longitude.toFixed(5)}
                                </p>
                            </div>
                            <div className="rounded-[26px] border border-black/8 bg-white/85 p-4">
                                <div className="mb-4 flex items-start justify-between">
                                    <span className="grid h-10 w-10 place-items-center rounded-full bg-black/[0.05]">
                                        <Radar className="h-5 w-5" />
                                    </span>
                                </div>
                                <p className="text-[1.02rem] font-semibold text-black/85">Auto Collect</p>
                                <p className="mt-1 text-[0.95rem] text-black/75">
                                    {pin.location.autoCollect ? "Enabled" : "Disabled"}
                                </p>
                            </div>
                            <div className="rounded-[26px] border border-black/8 bg-white/85 p-4">
                                <div className="mb-4 flex items-start justify-between">
                                    <span className="grid h-10 w-10 place-items-center rounded-full bg-black/[0.05]">
                                        <Layers3 className="h-5 w-5" />
                                    </span>
                                </div>
                                <p className="text-[1.02rem] font-semibold text-black/85">Remaining</p>
                                <p className="mt-1 text-[0.95rem] text-black/75">
                                    {pin.location.locationGroup?.remaining ?? 0}
                                </p>
                            </div>
                            <div className="rounded-[26px] border border-black/8 bg-white/85 p-5">
                                <div className="mb-4 flex items-start justify-between">
                                    <span className="grid h-10 w-10 place-items-center rounded-full bg-black/[0.05]">
                                        <CalendarClock className="h-5 w-5" />
                                    </span>
                                </div>
                                <p className="text-[1.02rem] font-semibold text-black/85">Created</p>
                                <p className="mt-1 text-[0.95rem] leading-6 text-black/80">
                                    {new Date(pin.location?.locationGroup?.startDate ?? "").toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="rounded-[26px] border border-black/8 bg-white/85 p-5">
                                <div className="mb-4 flex items-start justify-between">
                                    <span className="grid h-10 w-10 place-items-center rounded-full bg-black/[0.05]">
                                        <FileText className="h-5 w-5" />
                                    </span>
                                </div>
                                <p className="text-[1.02rem] font-semibold text-black/85">Description</p>
                                <p className="mt-1 text-[0.95rem] leading-6 text-black/80">
                                    {pin.location.locationGroup?.description}
                                </p>
                            </div>
                            <div className="rounded-[26px] border border-black/8 bg-white/85 p-5">
                                <div className="mb-4 flex items-start justify-between">
                                    <span className="grid h-10 w-10 place-items-center rounded-full bg-black/[0.05]">
                                        <CalendarDays className="h-5 w-5" />
                                    </span>
                                </div>
                                <p className="text-[1.02rem] font-semibold text-black/85">Start Date</p>
                                <p className="mt-1 text-[0.95rem] leading-6 text-black/80">
                                    {new Date(pin.location.locationGroup?.startDate ?? "").toLocaleString()}
                                </p>
                            </div>
                            <div className="rounded-[26px] border border-black/8 bg-white/85 p-5">
                                <div className="mb-4 flex items-start justify-between">
                                    <span className="grid h-10 w-10 place-items-center rounded-full bg-black/[0.05]">
                                        <CalendarClock className="h-5 w-5" />
                                    </span>
                                </div>
                                <p className="text-[1.02rem] font-semibold text-black/85">End Date</p>
                                <p className="mt-1 text-[0.95rem] leading-6 text-black/80">
                                    {new Date(pin.location.locationGroup?.endDate ?? "").toLocaleString()}
                                </p>
                            </div>
                            <div className="rounded-[26px] border border-black/8 bg-white/85 p-5">
                                <div className="mb-4 flex items-start justify-between">
                                    <span className="grid h-10 w-10 place-items-center rounded-full bg-black/[0.05]">
                                        <Layers3 className="h-5 w-5" />
                                    </span>
                                </div>
                                <p className="text-[1.02rem] font-semibold text-black/85">Limit</p>
                                <p className="mt-1 text-[0.95rem] leading-6 text-black/80">
                                    {pin.location.locationGroup?.limit}
                                </p>
                            </div>
                            {pin.location.locationGroup?.link ? (
                                <div className="rounded-[26px] border border-black/8 bg-white/85 p-5 md:col-span-3">
                                    <div className="mb-4 flex items-start justify-between">
                                        <span className="grid h-10 w-10 place-items-center rounded-full bg-black/[0.05]">
                                            <Link2 className="h-5 w-5" />
                                        </span>
                                    </div>
                                    <p className="text-[1.02rem] font-semibold text-black/85">Link</p>
                                    <a
                                        href={pin.location.locationGroup.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1 inline-block break-all text-[0.95rem] text-[#1f86ee] underline-offset-4 hover:underline"
                                    >
                                        {pin.location.locationGroup.link}
                                    </a>
                                </div>
                            ) : null}
                        </div>
                    </div>
                    <div className="h-3" />
                </div>
                <CardFooter className="mt-4 border-t border-black/10 bg-white/90 p-4 backdrop-blur-[4px]">
                    <Button onClick={handleClose} className="h-11 w-full rounded-xl border-0 bg-[#1f86ee] text-base font-semibold text-white shadow-none hover:bg-[#1877da]">
                        Close
                    </Button>
                </CardFooter>
            </DialogContent>
        </Dialog>
    );
}

