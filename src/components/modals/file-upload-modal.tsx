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
import { useEffect, useMemo, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import Image from "next/image";
import { UploadButton } from "~/utils/uploadthing";
import { api } from "~/utils/api";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import { Editor } from "../editor";

export const MediaInfo = z.object({
  url: z.string(),
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

  const { bountyId, submissionId } = data;

  const getSubmittedAttachment =
    api.bounty.Bounty.getSubmittedAttachmentById.useQuery({
      submissionId: submissionId ?? 0,
    });
  console.log(getSubmittedAttachment.data);
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof BountyAttachmentSchema>>({
    resolver: zodResolver(BountyAttachmentSchema),
    defaultValues: useMemo(() => {
      return {
        content: getSubmittedAttachment.data?.content,
        medias: getSubmittedAttachment.data?.attachmentUrl.map((url) => ({
          url: url,
        })),
      };
    }, [getSubmittedAttachment.data]),
  });

  const watchedMedias = watch("medias");
  useEffect(() => {
    if (getSubmittedAttachment.data && !watchedMedias) {
      setMedia(
        getSubmittedAttachment.data?.attachmentUrl.map((url) => ({
          url: url,
        })),
      );
    }
  }, [getSubmittedAttachment.data, watchedMedias]);

  const isModalOpen = isOpen && type === "upload file";
  console.log(data);
  const handleClose = () => {
    reset();
    setMedia([]);
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
  const UpdateBountyAttachment =
    api.bounty.Bounty.updateBountyAttachment.useMutation({
      onSuccess: () => {
        reset();
        toast.success("Attachment updated");
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
    if (submissionId) {
      UpdateBountyAttachment.mutate({
        content: data.content,
        submissionId: submissionId,
        medias: data.medias,
      });
    } else {
      createBountyAttachmentMutation.mutate({
        content: data.content,
        BountyId: bountyId ?? 0,
        medias: data.medias,
      });
    }
  };
  function handleEditorChange(value: string): void {
    setValue("content", value);
  }

  const removeMediaItem = (index: number) => {
    setMedia((prevMedia) => prevMedia.filter((_, i) => i !== index));
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
              {getSubmittedAttachment.data && !getSubmittedAttachment.isLoading
                ? "Update Attachment"
                : "Add Attachment"}
            </DialogTitle>
          </DialogHeader>

          {getSubmittedAttachment.isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <p>Loading...</p>
            </div>
          ) : (
            <>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex w-full flex-col gap-4 rounded-3xl bg-base-200 p-5"
              >
                <div className="h-[230px]  ">
                  <Editor
                    height="200px"
                    value={
                      getValues("content") ??
                      getSubmittedAttachment.data?.content
                    }
                    onChange={handleEditorChange}
                    placeholder="Add a Description..."
                  />
                  {errors.content && (
                    <div className="label">
                      <span className="label-text-alt text-warning">
                        {errors.content.message}
                      </span>
                    </div>
                  )}{" "}
                </div>
                <div className="mt-2 flex flex-col items-center gap-2 p-4 ">
                  <div className="flex flex-col gap-2 overflow-y-auto md:flex-row">
                    {media.map((el, id) => (
                      <div key={id} className="relative h-20 w-20">
                        <Image
                          src={el.url}
                          alt="media"
                          height={100}
                          width={100}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeMediaItem(id)}
                          className="absolute right-0 top-0 rounded-full bg-red-500 p-1 text-white"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
export default FileUploadModal;
