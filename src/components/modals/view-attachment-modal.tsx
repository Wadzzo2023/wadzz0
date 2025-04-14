import React from "react";
import { useModal } from "../../lib/state/play/use-modal-store";
import { Button } from "../shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/shadcn/ui/dialog";
import AttachmentSection from "../AttachmentSection";

const ViewAttachmentModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const isModalOpen = isOpen && type === "view attachment";

  const handleClose = () => {
    onClose();
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDownload = () => {
    // const fileUrl = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/snippet-GstNbOqFhV6gnmpgYP3eBDCSK96kPw.txt";
    // const fileName = "snippet-GstNbOqFhV6gnmpgYP3eBDCSK96kPw.txt";
    // downloadAttachment(fileUrl, fileName);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent
        onContextMenu={handleContextMenu}
        className="max-h-[80vh] overflow-y-auto p-6 md:max-w-[800px]"
      >
        <DialogHeader className="mb-6">
          <DialogTitle className="text-center text-3xl font-bold text-primary">
            Your Attachments
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-8">
          <AttachmentSection
            title="Audio"
            attachments={data.attachment?.filter((a) => a.type.startsWith("audio/"))}
          />
          <AttachmentSection
            title="Video"
            attachments={data.attachment?.filter((a) => a.type.startsWith("video/"))}
          />
          <AttachmentSection
            title="Images"
            attachments={data.attachment?.filter((a) => a.type.startsWith("image/"))}
          />
          <AttachmentSection
            title="Documents"
            attachments={data.attachment?.filter((a) => a.type.startsWith("application/"))}
          />
          <AttachmentSection
            title="Text"
            attachments={data.attachment?.filter((a) => a.type.startsWith("text/"))}
          />
        </div>
        <DialogFooter className="mt-8 flex justify-between">

          <Button onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewAttachmentModal;

