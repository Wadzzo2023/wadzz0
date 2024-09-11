"use client";
import { Button } from "~/components/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Editor } from "~/components/editor";
import { BountyStatus, MediaType } from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { UploadButton } from "~/utils/uploadthing";
import { api } from "~/utils/api";
import toast from "react-hot-toast";
import { useModal } from "../hooks/use-modal-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../shadcn/ui/dialog";
import { X } from "lucide-react"; // Import a delete icon

import { PLATFROM_ASSET } from "~/lib/stellar/constant";

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
      BountyId: bountyId ?? 0,
      title: data.title,
      content: data.content,
      requiredBalance: data.requiredBalance,
      medias: data.medias,
      status: data.status,
    });
  };

  const addMediaItem = (url: string) => {
    setMedia((prevMedia) => [...prevMedia, { url }]);
  };

  const removeMediaItem = (index: number) => {
    setMedia((prevMedia) => prevMedia.filter((_, i) => i !== index));
  };

  function handleEditorChange(value: string): void {
    setValue("content", value);
  }

  useEffect(() => {
    if (CurrentBounty) {
      const initialMedia = CurrentBounty.imageUrls.map((url) => ({
        url: url,
      }));
      setMedia(initialMedia);
    }
  }, [CurrentBounty]);

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <>
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
                <label className="h-[240px]">
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
                    <label className=" mb-1 w-full text-xs tracking-wide text-gray-600 sm:text-sm">
                      Required Balance to Join this Bounty in{" "}
                      {PLATFROM_ASSET.code}
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
