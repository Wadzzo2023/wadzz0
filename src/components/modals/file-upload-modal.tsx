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
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "../shadcn/ui/textarea";
import { MediaType } from "@prisma/client";
import { useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import Image from "next/image";
import { UploadButton } from "~/utils/uploadthing";
import { api } from "~/utils/api";
import toast from "react-hot-toast";

export const MediaInfo = z.object({
  url: z.string(),
  type: z.string().default(MediaType.IMAGE),
});
type MediaInfoType = z.TypeOf<typeof MediaInfo>;

export const BountyAttachmentSchema = z.object({
  BountyId: z.number().optional(),
  content: z.string().min(2, { message: "Description can't be empty" }),
  medias: z.array(MediaInfo).optional(),
});

const FileUploadModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const [media, setMedia] = useState<MediaInfoType[]>([]);
  const [wantMediaType, setWantMedia] = useState<MediaType>();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof BountyAttachmentSchema>>({
    resolver: zodResolver(BountyAttachmentSchema),
  });
  const { bountyId } = data;

  const isModalOpen = isOpen && type === "upload file";
  console.log(data);
  const handleClose = () => {
    onClose();
  };

  const utils = api.useUtils();
  const createBountyAttachmentMutation =
    api.bounty.Bounty.createBountyAttachment.useMutation({
      onSuccess: () => {
        reset();
        toast.success("Attachment submitted");
        utils.bounty.Bounty.getBountyAttachmentByUserId
          .refetch()
          .then(() => {
            handleClose();
          })
          .catch(() => {
            handleClose();
          });
        setMedia([]);
        handleClose();
      },
    });

  const onSubmit: SubmitHandler<z.infer<typeof BountyAttachmentSchema>> = (
    data,
  ) => {
    data.BountyId = bountyId;
    data.medias = media;
    console.log("data", data);
    createBountyAttachmentMutation.mutate({
      content: data.content,
      BountyId: bountyId ?? 0,
      medias: data.medias,
    });
  };

  const addMediaItem = (url: string, type: MediaType) => {
    setMedia((prevMedia) => [...prevMedia, { url, type }]);
  };

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="overflow-hidden p-0">
          <DialogHeader className="px-6 pt-8">
            <DialogTitle className="text-center text-2xl font-bold">
              Attach Your File
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex w-full flex-col gap-4 rounded-3xl bg-base-200 p-5"
          >
            <label className="form-control w-full ">
              <Textarea
                className="h-32 w-full"
                {...register("content", {
                  required: "Description can't be empty",
                })}
                placeholder="Write your message here"
              />
              {errors.content && (
                <div className="label">
                  <span className="label-text-alt text-warning">
                    {errors.content.message}
                  </span>
                </div>
              )}{" "}
            </label>
            <div className="flex gap-2 p-2">
              {media.map((el, id) => (
                <Image key={id} src={el.url} alt="d" height={100} width={100} />
              ))}
            </div>

            <UploadButton
              endpoint="imageUploader"
              content={{
                button: "Add Media",
                allowedContent: "Max (4MB)",
              }}
              onClientUploadComplete={(res) => {
                const data = res[0];

                if (data?.url) {
                  addMediaItem(data.url, wantMediaType!);
                  setWantMedia(undefined);
                }
              }}
              onUploadError={(error: Error) => {
                alert(`ERROR! ${error.message}`);
              }}
            />
            <Button className="w-full" type="submit">
              Submit
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default FileUploadModal;
