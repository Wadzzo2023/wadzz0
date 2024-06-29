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
import {
  CircleOff,
  Copy,
  LayersIcon,
  ShieldBan,
  ShieldCheck,
  ShieldMinus,
} from "lucide-react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { set } from "date-fns";

const MapModal = () => {
  const {
    isOpen,
    onClose,
    type,
    data,
    isPinCopied,
    setIsPinCopied,
    setIsAutoCollect,
    isAutoCollect,
  } = useModal();

  const session = useSession();
  const isModalOpen = isOpen && type === "map";
  const handleClose = () => {
    onClose();
  };

  console.log("isPinCopied", isPinCopied);

  const ToggleAutoCollectMutation = api.maps.pin.toggleAutoCollect.useMutation({
    onSuccess: (data) => {
      toast.success("Auto collect disabled successfully");
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleToggleAutoCollect = async (pinId: number | undefined) => {
    if (pinId) {
      console.log(pinId);
      if (isAutoCollect) {
        ToggleAutoCollectMutation.mutate({
          id: pinId,
          isAutoCollect: false,
        });
      } else {
        ToggleAutoCollectMutation.mutate({
          id: pinId,
          isAutoCollect: true,
        });
      }
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

  const DeletePin = api.maps.pin.deletePin.useMutation({
    onSuccess: (data) => {
      if (data.item) {
        toast.success("Pin deleted successfully");
        handleClose();
      } else {
        toast.error(
          "Pin not found or You are not authorized to delete this pin",
        );
      }
    },
    onError: (error) => {
      toast.error(error.message);
      console.log(error);
    },
  });
  const handleDelete = () => {
    if (data?.pinId) {
      DeletePin.mutate({ id: data?.pinId });
      console.log("handleDelete", data?.pinId);
      toast.success("Pin deleted successfully");
      handleClose();
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
            {isAutoCollect ? (
              <Button
                className="m-1 w-1/2 "
                onClick={() => handleToggleAutoCollect(data.pinId)}
              >
                <ShieldCheck size={15} className="mr-1" /> Disable Auto Collect
              </Button>
            ) : (
              <Button
                className="m-1 w-1/2 "
                onClick={() => handleToggleAutoCollect(data.pinId)}
              >
                <ShieldBan size={15} className="mr-1" /> Enable Auto Collect
              </Button>
            )}
            <Button className="m-1 w-1/2 " onClick={handleDelete}>
              <ShieldMinus size={15} className="mr-1" /> Delete Pin
            </Button>
          </div>
          <DialogFooter className=" px-6 py-4"></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default MapModal;
