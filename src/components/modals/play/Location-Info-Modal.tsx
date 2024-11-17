"use client";

import React from "react";

import { Button } from "~/components/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/components/shadcn/ui/avatar";
import { ScrollArea } from "~/components/shadcn/ui/scroll-area";
import { Separator } from "~/components/shadcn/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";
import { InfoIcon, MapPin, Gift } from "lucide-react";
import { useModal } from "~/lib/state/play/useModal";
import Image from "next/image";

interface LocationData {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  brand_name: string;
  image_url: string;
  collection_limit_remaining: number;
  brand_image_url: string;
}

export default function LocationInformationModal() {
  const { isOpen, onClose, type, data } = useModal();
  const isModalOpen = isOpen && type === "LocationInformation";

  const handleClose = () => {
    onClose();
  };

  const locationData = data?.Collection;

  if (!isModalOpen || !locationData) {
    return null;
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{locationData.title}</DialogTitle>
          <DialogDescription>{locationData.brand_name}</DialogDescription>
        </DialogHeader>
        <Card className="w-full">
          <CardHeader className="p-0">
            <Image
              height={200}
              width={200}
              src={locationData.image_url}
              alt={locationData.title}
              className="h-48 w-full rounded-t-lg object-cover"
            />
          </CardHeader>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center space-x-4">
              <Avatar>
                <AvatarImage
                  src={locationData.brand_image_url}
                  alt={locationData.brand_name}
                />
                <AvatarFallback>
                  {locationData.brand_name.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{locationData.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {locationData.brand_name}
                </p>
              </div>
            </div>
            <Separator className="my-4" />
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              <div className="mb-4 flex items-start space-x-2">
                <InfoIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <p className="text-sm">{locationData.description}</p>
              </div>
              <div className="mb-4 flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm">
                  Latitude: {locationData.lat.toFixed(6)}, Longitude:{" "}
                  {locationData.lng.toFixed(6)}
                </p>
              </div>
              <div className="mb-4 flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm">ID: {locationData.id}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Gift className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm">
                  Remaining: {locationData.collection_limit_remaining}
                </p>
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
