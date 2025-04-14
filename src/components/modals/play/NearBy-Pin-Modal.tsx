"use client";

import React from "react";
import { useModal } from "~/lib/state/play/useModal";

import { Button } from "~/components/shadcn/ui/button";
import { Card, CardContent, CardFooter } from "~/components/shadcn/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/shadcn/ui/dialog";

export default function NearbyPinModal() {
  const { isOpen, onClose, type } = useModal();
  const isModalOpen = isOpen && type === "NearbyPin";

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nearby Pins</DialogTitle>
        </DialogHeader>
        <Card className="w-full">
          <CardContent className="pt-6">
            <p className="text-center text-lg font-medium">
              No Nearby Pins Available!
            </p>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline" onClick={handleClose} className="w-full">
              Close
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
