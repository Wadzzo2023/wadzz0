"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { Button } from "~/components/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/shadcn/ui/dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import { useModal } from "~/lib/state/play/useModal";
import { useBounty } from "~/lib/state/play/useBounty";
import { JoinBounty } from "~/lib/play/join-bounty";

const JoinBountyModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const isModalOpen = isOpen && type === "JoinBounty";
  const router = useRouter();
  const { setData } = useBounty();
  const queryClient = useQueryClient();

  const handleClose = () => {
    onClose();
  };

  const JoinMutation = useMutation({
    mutationFn: async ({ bountyId }: { bountyId: number }) => {
      return await JoinBounty({ bountyId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["bounties"],
      });
      setData({ item: data.bounty });
      onClose();
      router.push(`/play/bounty/${data.bounty?.id}`);
    },
    onError: () => {
      toast.error("Failed to join bounty");
    },
  });

  const handleJoin = (bountyId: number) => {
    JoinMutation.mutate({ bountyId });
  };
  const { bounty, balance } = data;

  if (!balance || !bounty) {
    return (
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Bounty?</DialogTitle>
            <DialogDescription>
              Do you want to join this bounty? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 rounded-md bg-gray-100 p-2">
            <p className="text-lg font-bold text-gray-800">{bounty?.title}</p>
          </div>
          <p className="text-center text-red-500">
            You do not have enough balance to join this bounty.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <Card>
          <CardHeader>
            <CardTitle>Join Bounty?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-gray-500">
              Do you want to join this bounty? This action cannot be undone.
            </p>
            <div className="rounded-md bg-gray-100 p-2">
              <p className="text-lg font-bold text-gray-800">{bounty?.title}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleJoin(Number(bounty.id))}
              disabled={
                bounty.requiredBalance > balance || JoinMutation.isLoading
              }
            >
              {JoinMutation.isLoading ? "Joining..." : "Join"}
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default JoinBountyModal;
