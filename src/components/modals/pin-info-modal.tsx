import { useSession } from "next-auth/react";
import Image from "next/image";
import { api } from "~/utils/api";

import { Button } from "~/components/shadcn/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/shadcn/ui/dialog";

import { z } from "zod";
import { addrShort } from "~/utils/utils";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import { Card, CardContent, CardFooter } from "~/components/shadcn/ui/card";
import { useModal } from "~/lib/state/play/use-modal-store";
import { SparkleEffect } from "./modal-action-button";
import { Badge } from "~/components/shadcn/ui/badge";

export const PaymentMethodEnum = z.enum(["asset", "xlm", "card"]);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

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
            <DialogContent className="max-w-3xl overflow-hidden p-0 [&>button]:rounded-full [&>button]:border [&>button]:border-black [&>button]:bg-white [&>button]:text-black">
                <DialogHeader className="p-6 bg-gray-100">
                    <DialogTitle className="text-2xl font-bold">{pin.location.locationGroup?.title}</DialogTitle>
                </DialogHeader>
                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <h3 className="text-lg font-semibold mb-2">Pin Details</h3>
                                <p><strong>ID:</strong> {pin.location?.locationGroupId?.slice(0, 10) + "..."}</p>
                                <p><strong>Created:</strong> {new Date(pin.location?.locationGroup?.startDate ?? "").toLocaleString()}</p>


                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <h3 className="text-lg font-semibold mb-2">Location</h3>
                                <p><strong>Latitude:</strong> {pin.location.latitude.toFixed(6)}</p>
                                <p><strong>Longitude:</strong> {pin.location.longitude.toFixed(6)}</p>
                                <p><strong>Auto Collect:</strong> {pin.location.autoCollect ? 'Yes' : 'No'}</p>
                            </CardContent>
                        </Card>
                    </div>
                    <Card className="mt-4">
                        <CardContent className="p-4">
                            <h3 className="text-lg font-semibold mb-2">Location Group</h3>
                            <p><strong>Description:</strong> {pin.location.locationGroup?.description}</p>
                            <p><strong>Start Date:</strong> {new Date(pin.location.locationGroup?.startDate ?? "").toLocaleString()}</p>
                            <p><strong>End Date:</strong> {new Date(pin.location.locationGroup?.endDate ?? "").toLocaleString()}</p>
                            <p><strong>Limit:</strong> {pin.location.locationGroup?.limit}</p>
                            <p><strong>Remaining:</strong> {pin.location.locationGroup?.remaining}</p>
                            <p><strong>Privacy:</strong> {pin.location.locationGroup?.privacy}</p>
                            {pin.location.locationGroup?.link && (
                                <p><strong>Link:</strong> <a href={pin.location.locationGroup.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{pin.location.locationGroup.link}</a></p>
                            )}
                        </CardContent>
                    </Card>
                    <div className="mt-4 flex justify-between items-center">
                        <div>
                            <Badge variant={pin.location.locationGroup?.multiPin ? "secondary" : "outline"}>
                                {pin.location.locationGroup?.multiPin ? "Multi-Pin" : "Single-Pin"}
                            </Badge>
                            <Badge variant={pin.location.locationGroup?.pageAsset ? "secondary" : "outline"} className="ml-2">
                                {pin.location.locationGroup?.pageAsset ? "Page Asset" : "Regular Asset"}
                            </Badge>
                        </div>
                        {pin.location.locationGroup?.image && (
                            <div className="relative w-24 h-24">
                                <Image
                                    src={pin.location.locationGroup?.image}
                                    alt={pin.location.locationGroup.title}
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded-md"
                                />
                            </div>
                        )}
                    </div>
                </div>
                <CardFooter className="bg-gray-100 p-4">
                    <Button onClick={handleClose} className="w-full">Close</Button>
                </CardFooter>
            </DialogContent>
        </Dialog>
    );
}

