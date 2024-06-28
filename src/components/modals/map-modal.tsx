import QRCode from "react-qr-code";
import { useModal } from "../hooks/use-modal-store";
import CopyToClip from "../wallete/copy_to_Clip";
import { Button } from "../shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/shadcn/ui/dialog";
import { useSession } from "next-auth/react";
import { addrShort } from "~/utils/utils";
import { api } from "~/utils/api";
import toast from "react-hot-toast";
import { CircleOff, Copy, LayersIcon } from "lucide-react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { set } from "date-fns";

const MapModal = () => {
  const { isOpen, onClose, type, data, isPinCopied, setIsPinCopied } =
    useModal();

  const session = useSession();
  const isModalOpen = isOpen && type === "map";
  const handleClose = () => {
    onClose();
  };

  console.log("isPinCopied", isPinCopied);

  const DisableAutoCollectMutation =
    api.maps.pin.disableAutoCollect.useMutation({
      onSuccess: (data) => {
        toast.success("Auto collect disabled successfully");
        handleClose();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const handleDisableAutoCollect = async (pinId: number | undefined) => {
    if (pinId) {
      DisableAutoCollectMutation.mutate({
        id: pinId,
      });
    } else {
      toast.error("Pin Id not found");
    }
  };

  const handleCopyPin = () => {
    if (data?.pinId) {
      console.log("handleCopyPin", data?.pinId);
      toast.success("Pin Id copied to clipboard");
      setIsPinCopied(true);
    } else {
      toast.error("Pin Id not found");
    }
  };
  if (!session?.data?.user?.id) {
    return <div>Public Key not found</div>;
  }
  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="overflow-hidden p-0">
          <DialogHeader className="px-6 pt-8">
            <DialogTitle className="text-center text-2xl font-bold">
              MAP ACTION MENU
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex flex-col items-center justify-center md:mt-0">
            <Button className="m-1 w-1/2 " onClick={handleCopyPin}>
              <Copy size={15} className="mr-1" /> Copy Pin
            </Button>
            <Button
              className="m-1 w-1/2 "
              onClick={() => handleDisableAutoCollect(data.pinId)}
            >
              <CircleOff size={15} className="mr-1" /> Disable Auto Collect
            </Button>
          </div>
          <DialogFooter className=" px-6 py-4"></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default MapModal;
