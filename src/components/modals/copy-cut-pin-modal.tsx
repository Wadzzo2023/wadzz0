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
  BadgeMinus,
  BadgePlus,
  CircleDashed,
  CircleIcon,
  CircleOff,
  ClipboardCheck,
  Copy,
  LayersIcon,
  Plus,
  X,
} from "lucide-react";

const CopyCutPinModal = () => {
  const {
    isOpen,
    onClose,
    type,
    data,
    isPinCopied,
    setIsPinCut,
    isPinCut,
    setIsPinCopied,
  } = useModal();
  const session = useSession();
  console.log("Cut", isPinCut);

  const PastePin = api.maps.pin.paste.useMutation({
    onSuccess: async (data) => {
      if (data.id) {
        toast.success("Pin pasted successfully");
        handleCancel();
      } else {
        toast.error("Something went wrong");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleClose = () => {
    onClose();
  };

  const handlePastePin = () => {
    console.log("handlePastePin", data?.pinId, data?.long, data?.lat);
    if (data?.pinId && data?.long && data?.lat) {
      console.log("handlePastePin", data?.pinId, data?.long, data?.lat);
      PastePin.mutate({
        id: data?.pinId,
        long: data?.long,
        lat: data?.lat,
        isCut: isPinCut,
      });
    } else {
      toast.error("Pin Id not found");
    }
  };

  const handleCancel = () => {
    setIsPinCopied(false);
    setIsPinCut(false);
    handleClose();
  };

  const isModalOpen = isOpen && type === "copied";

  if (!session?.data?.user?.id) {
    return <div>Public Key not found</div>;
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="overflow-hidden p-0">
        <DialogHeader className="px-6 pt-8">
          <DialogTitle className="text-center text-2xl font-bold">
            {/* MAP ACTION MENU */}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 flex flex-col items-center justify-center md:mt-0">
          <Button className="m-1 w-1/2 ">
            <BadgePlus size={15} className="mr-1" />
            Create New Billboard
          </Button>
          <Button onClick={handlePastePin} className="m-1 w-1/2 ">
            <ClipboardCheck size={15} className="mr-1" />
            Paste Pin
          </Button>
          <Button onClick={handleCancel} className="m-1 w-1/2 ">
            <BadgeMinus size={15} className="mr-1" />
            Cancel
          </Button>
        </div>
        <DialogFooter className=" px-6 py-4"></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CopyCutPinModal;
