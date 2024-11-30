"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { BountyStatus } from "@prisma/client";
import { X } from "lucide-react"; // Import a delete icon
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Editor } from "~/components/editor";
import { Button } from "~/components/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/shadcn/ui/card";
import { api } from "~/utils/api";
import { UploadButton } from "~/utils/uploadthing";
import { useModal } from "../../lib/state/play/use-modal-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../shadcn/ui/dialog";

import { PLATFORM_ASSET } from "~/lib/stellar/constant";

export const MediaInfo = z.object({
  url: z.string(),
});

type MediaInfoType = z.TypeOf<typeof MediaInfo>;

const BountySchema = z.object({
  title: z.string().min(1, { message: "Title can't be empty" }),
  requiredBalance: z
    .number()
    .min(0, { message: "Required Balance can't be less than 0" }),
  content: z.string().min(2, { message: "Description can't be empty" }),
  medias: z.array(MediaInfo).optional(),
  status: z.nativeEnum(BountyStatus).optional(),
});

const EditBountyModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const { bountyId } = data;
  const isModalOpen = isOpen && type === "edit bounty";
  const [media, setMedia] = useState<MediaInfoType[]>([]);

  const { data: CurrentBounty, isLoading: CurrentBountyIsLoading } =
    api.bounty.Bounty.getBountyByID.useQuery({
      BountyId: data.bountyId ?? 0,
    });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof BountySchema>>({
    resolver: zodResolver(BountySchema),
    defaultValues: useMemo(() => {
      return {
        title: CurrentBounty?.title,
        content: CurrentBounty?.description,
        requiredBalance: CurrentBounty?.requiredBalance,
        status: CurrentBounty?.status,
      };
    }, [CurrentBounty]),
  });
  const utils = api.useUtils();
  const updateBountyMutation = api.bounty.Bounty.updateBounty.useMutation({
    onSuccess: () => {
      utils.bounty.Bounty.getBountyByID
        .refetch()
        .catch((e) => console.error(e));
      handleClose();
      toast.success("Bounty Updated");
      setMedia([]);
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof BountySchema>> = (data) => {
    data.medias = media;
    updateBountyMutation.mutate({
      BountyId: bountyId!,
      title: data.title,
      content: data.content,
      requiredBalance: data.requiredBalance,
      medias: data.medias,
      status: data.status,
    });
  };

  const addMediaItem = (url: string) => {
    setMedia([{ url }]); // Replace all existing media with the new one
  };

  const removeMediaItem = (index: number) => {
    setMedia((prevMedia) => prevMedia.filter((_, i) => i !== index));
  };

  function handleEditorChange(value: string): void {
    setValue("content", value);
  }

  useEffect(() => {
    if (CurrentBounty) {
      const initialMedia = CurrentBounty.imageUrls.map((url) => ({ url }));
      setMedia(initialMedia);
    } else {
      setMedia([]); // Reset when there's no data
    }
  }, [CurrentBounty]);


  const handleClose = () => {
    setMedia([]);
    reset();
    onClose();
  };

  if (CurrentBountyIsLoading) return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="overflow-hidden p-0">
        <DialogHeader className="px-6 pt-8">
          <DialogTitle className="text-center text-2xl font-bold">
            Edit Bounty
          </DialogTitle>
        </DialogHeader>
        <Card className="w-full ">
          <CardHeader className="p-2"></CardHeader>
          <CardContent>
            <div className="flex justify-center items-center h-96">
              <div role="status">
                <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="overflow-y-auto max-h-[750px] p-0">
          <DialogHeader className="px-6 pt-8">
            <DialogTitle className="text-center text-2xl font-bold">
              Edit Bounty
            </DialogTitle>
          </DialogHeader>
          <Card className="w-full ">
            <CardHeader className="p-2"></CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex w-full flex-col gap-4 rounded-3xl bg-base-200 p-5"
              >
                <label className="form-control w-full ">
                  <input
                    defaultValue={CurrentBounty ? CurrentBounty.title : ""}
                    type="text"
                    placeholder="Add a Title..."
                    {...register("title")}
                    className="input input-bordered w-full "
                  />
                  {errors.title && (
                    <div className="label">
                      <span className="label-text-alt text-warning">
                        {errors.title.message}
                      </span>
                    </div>
                  )}
                </label>
                <label className="h-[280px]">
                  <Editor
                    height="200px"
                    value={getValues("content") ?? CurrentBounty?.description}
                    onChange={handleEditorChange}
                    placeholder="Add a Description..."
                  />

                  {errors.content && (
                    <div className="label">
                      <span className="label-text-alt text-warning">
                        {errors.content.message}
                      </span>
                    </div>
                  )}
                </label>

                <label className=" mb-1 w-full text-xs tracking-wide text-gray-600 sm:text-sm">
                  Required Balance to Join this Bounty in{" "}
                  {PLATFORM_ASSET.code}
                  <input
                    type="number"
                    defaultValue={CurrentBounty?.requiredBalance}
                    {...register("requiredBalance", {
                      valueAsNumber: true,
                    })}
                    className="input input-bordered   w-full"
                  />
                  {errors.requiredBalance && (
                    <div className="label">
                      <span className="label-text-alt text-warning">
                        {errors.requiredBalance.message}
                      </span>
                    </div>
                  )}
                </label>
                <label className="form-control w-full ">
                  <span className="label-text">Status</span>
                  <select
                    {...register("status")}
                    defaultValue={CurrentBounty?.status}
                    className="select select-bordered w-full"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                  {errors.status && (
                    <div className="label">
                      <span className="label-text-alt text-warning">
                        {errors.status.message}
                      </span>
                    </div>
                  )}
                </label>
                <div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-2">
                      {media.map((el, id) => (
                        <div key={id} className="relative">
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
                    <UploadButton
                      endpoint="imageUploader"
                      content={{
                        button: "Add Media",
                        allowedContent: "Max (4MB)",
                      }}
                      onClientUploadComplete={(res) => {
                        const data = res[0];

                        if (data?.url) {
                          addMediaItem(data.url);
                        }
                      }}
                      onUploadError={(error: Error) => {
                        alert(`ERROR! ${error.message}`);
                      }}
                    />
                  </div>
                </div>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => handleClose()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateBountyMutation.isLoading}
                  >
                    Update
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditBountyModal;
