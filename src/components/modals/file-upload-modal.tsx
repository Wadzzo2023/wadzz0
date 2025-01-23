import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/shadcn/ui/dialog";
import { api } from "~/utils/api";

import { useModal } from "../../lib/state/play/use-modal-store";
import { Editor } from "../editor";
import { Button } from "../shadcn/ui/button";
import { MultiUploadS3Button } from "~/pages/test";

export const SubmissionMediaInfo = z.object({
  url: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
});

export const allowedSubmissionTypes = [
  "image/*", // All image types
  "video/*", // All video types
  "audio/*", // All audio types
  "application/vnd.google-apps.document", // Google Docs
  "application/vnd.google-apps.spreadsheet", // Google Sheets
  "text/plain", // Plain text
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
  "application/vnd.ms-excel", // XLS (old Excel format)
  "text/csv", // CSV
  "text/tab-separated-values", // TSV
  "application/pdf", // PDF
  "application/vnd.oasis.opendocument.spreadsheet", // ODS (OpenDocument Spreadsheet)
];

type SubmissionMediaInfoType = z.TypeOf<typeof SubmissionMediaInfo>;

export const BountyAttachmentSchema = z.object({
  BountyId: z.number().optional(),
  content: z.string().min(2, { message: "Description can't be empty" }),
  medias: z.array(SubmissionMediaInfo).optional(),
});

const FileUploadModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const [media, setMedia] = useState<SubmissionMediaInfoType[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]); // Track multiple files
  const [progress, setProgress] = useState<number[]>([]); // Track progress for each file
  const { bountyId, submissionId } = data;
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loading, setLoading] = useState<boolean>(false);

  const getSubmittedAttachment =
    api.bounty.Bounty.getSubmittedAttachmentById.useQuery({
      submissionId: submissionId ?? 0,
    });
  // console.log(getSubmittedAttachment.data);
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
  });

  const isModalOpen = isOpen && type === "upload file";
  // console.log(data);
  const handleClose = () => {
    reset();
    setMedia([]); // Clear media when modal is closed
    setIsInitialLoad(true); // Reset initial load state for the next time modal is opened
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
        utils.bounty.Bounty.getSubmittedAttachmentById
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

  useEffect(() => {
    // Only load the media from the server on the first load
    if (getSubmittedAttachment.data && isInitialLoad) {
      setMedia(getSubmittedAttachment.data.medias ?? []);
      setIsInitialLoad(false); // After loading, mark initial load as done
    }
  }, [getSubmittedAttachment.data, isInitialLoad]);

  const onSubmit: SubmitHandler<z.infer<typeof BountyAttachmentSchema>> = (
    data,
  ) => {
    data.BountyId = bountyId;
    data.medias = media;
    // console.log("data data data", data);
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
  const addMediaItem = (
    url: string,
    name: string,
    size: number,
    type: string,
  ) => {
    setMedia((prevMedia) => [...prevMedia, { url, name, size, type }]);
  };

  // console.log(media);
  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className=" p-0 max-h-[800px]">
          <DialogHeader className="px-6 pt-2 md:pt-8">
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
                className="flex w-full flex-col gap-4 rounded-3xl bg-base-200 py-5 md:p-5 "
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
                <div className="mt-2 flex flex-col items-center gap-2">
                  <div className="mt-10 flex max-h-[200px] w-full flex-col gap-2 overflow-y-auto">
                    {/* Display uploading files with progress */}
                    {uploadingFiles.map((file, index) => (
                      <div
                        key={index}
                        className="w-full rounded-md bg-[#F5F7FB] px-8 py-4 shadow-sm "
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate text-base font-medium text-[#07074D]">
                            {shortFileName(file.name)}
                          </span>
                          <button
                            className="text-[#07074D]"
                            onClick={() => removeMediaItem(index)} // Add logic to remove uploading file if needed
                          >
                            <Trash size={15} />
                          </button>
                        </div>
                        {/* Progress bar for each uploading file */}
                        <div className="relative mt-5 h-[6px] w-full rounded-lg bg-[#E2E5EF]">
                          <div
                            className="absolute left-0 h-full rounded-lg bg-[#6A64F1]"
                            style={{ width: `${progress[index] ?? 0}%` }} // Show progress for each file
                          ></div>
                        </div>
                      </div>
                    ))}

                    {/* Display previously uploaded media */}
                    {media.map((el, id) => (
                      <div
                        key={id}
                        className="w-full rounded-md bg-[#F5F7FB] px-8 py-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate text-base font-medium text-[#07074D]">
                            {shortFileName(el.name)}
                          </span>
                          <button
                            className="text-[#07074D]"
                            onClick={() => removeMediaItem(id)} // Remove uploaded media item
                          >
                            <Trash size={15} />
                          </button>
                        </div>
                        <div className="relative mt-5 h-[6px] w-full rounded-lg bg-[#E2E5EF]">
                          <div className="absolute left-0 right-0 h-full w-[100%] rounded-lg bg-[#6A64F1]"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <span className="text-center text-xs text-red-400">
                  You can only upload a maximum of 5 files at a time.
                </span>
                <MultiUploadS3Button
                  endpoint="multiBlobUploader"

                  onUploadProgress={(progressValue) => {
                    setProgress((prevProgress) => {
                      // Assuming progress for the first file in the uploadingFiles list is updated
                      const newProgress = [...prevProgress];
                      newProgress[0] = progressValue; // Update the progress for the first file (or manage index accordingly)
                      return newProgress;
                    });
                  }}
                  onClientUploadComplete={(res) => {
                    toast.success("Media uploaded");

                    // Handle the uploaded file(s)
                    res.forEach((data) => {
                      // console.log(data);
                      if (data?.url) {
                        addMediaItem(data.url, data.name, data.size, data.type);
                      }
                    });

                    // Clear the uploading files and progress state after completion
                    setUploadingFiles([]);
                    setProgress([]);
                    setLoading(false);
                  }}

                  onUploadError={(error: Error) => {
                    setLoading(false);
                    toast.error(error.message);
                  }}
                />
                <Button
                  disabled={
                    createBountyAttachmentMutation.isLoading ||
                    UpdateBountyAttachment.isLoading
                  }
                  className="w-full"
                  type="submit"
                >
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

const shortFileName = (fileName: string) => {
  const shortFileName = fileName.split(".")[0];
  const extension = fileName.split(".")[1];
  if (shortFileName && shortFileName.length > 20) {
    return `${shortFileName?.slice(0, 20)}...${extension}`;
  }
  return fileName;
};
