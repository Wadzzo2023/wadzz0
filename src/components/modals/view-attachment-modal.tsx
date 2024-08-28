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
import Image from "next/image";

const ViewAttachmentModal = () => {
  const { isOpen, onClose, type, data } = useModal();

  const isModalOpen = isOpen && type === "view attachment";

  const handleClose = () => {
    onClose();
  };

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="max-h-[80%] min-w-[60%] overflow-y-auto p-4">
          <DialogHeader className="px-6 pt-8">
            <DialogTitle className="text-center text-2xl font-bold">
              Attach Your File
            </DialogTitle>
          </DialogHeader>
          <div>
            {data.attachment?.length === 0 && (
              <p className="w-full text-center">There is no attachment yet</p>
            )}
            {data?.attachment?.map((attachment, idx) => (
              <div key={idx} className="flex items-center justify-center">
                <Image
                  src={attachment}
                  height={1000}
                  width={1000}
                  alt=""
                  className="h-full w-full "
                />
              </div>
            ))}
          </div>
          <DialogFooter className="flex justify-center">
            <Button className="w-full" onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default ViewAttachmentModal;
