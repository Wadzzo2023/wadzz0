"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/shadcn/ui/dialog";
import { Button } from "~/components/shadcn/ui/button";
import { useModal } from "~/lib/state/play/useModal";
import { BASE_URL } from "~/lib/common";

const DeleteCollectionModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const isModalOpen = isOpen && type === "Delete";
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleClose = () => {
    onClose();
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      setIsDeleting(true);
      const response = await fetch(
        new URL("api/game/locations/hide_billboard", BASE_URL).toString(),
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ location_id: data?.collectionId?.toString() }),
        },
      );

      if (!response.ok) {
        setIsDeleting(false);
        throw new Error("Failed to delete collection");
      }

      const result = (await response.json()) as { message: string };
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["collection"],
      });
      setIsDeleting(false);
      onClose();
    },
    onError: (error) => {
      setIsDeleting(false);
      console.error("Error deleting collection:", error);
    },
  });

  const handleDelete = useCallback(() => {
    deleteMutation.mutate();
  }, [deleteMutation]);

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Collection?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this collection? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 rounded-md bg-secondary p-4">
          <p className="text-lg font-bold text-primary">
            {data?.collectionName ?? "Unnamed Collection"}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCollectionModal;
