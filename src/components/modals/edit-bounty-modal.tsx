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
import { MediaType } from "@prisma/client";
import { useEffect, useState } from "react";
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

export const MediaInfo = z.object({
  url: z.string(),
});

type MediaInfoType = z.TypeOf<typeof MediaInfo>;

const BountySchema = z.object({
  title: z.string().min(1, { message: "Title can't be empty" }),
  priceInUSD: z.number().min(1, { message: "Price can't less than 0" }),
  priceInBAND: z.number().min(1, { message: "Price can't less than 0" }),
  content: z.string().min(2, { message: "Description can't be empty" }),
  medias: z.array(MediaInfo).optional(),
});

const EditBountyModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const { bountyId } = data;
  const isModalOpen = isOpen && type === "edit bounty";
  const [media, setMedia] = useState<MediaInfoType[]>([]);
  const [wantMediaType, setWantMedia] = useState<MediaType>();

  const { data: CurrentBounty, isLoading: CurrentBountyLoading } =
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
    defaultValues: {
      title: CurrentBounty?.title,
      priceInUSD: CurrentBounty?.priceInUSD,
      priceInBAND: CurrentBounty?.priceInBand,
      content: CurrentBounty?.description,
      medias: CurrentBounty?.imageUrls.map((url) => ({ url: url })),
    },
  });

  const updateBountyMutation = api.bounty.Bounty.updateBounty.useMutation({
    onSuccess: () => {
      reset();
      toast.success("Bounty Updated");
      setMedia([]);
      handleClose();
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof BountySchema>> = (data) => {
    data.medias = media;
    console.log(CurrentBounty);
    console.log("data", data);
    updateBountyMutation.mutate({
      BountyId: bountyId ?? 0,
      title: data.title,
      content: data.content,
      priceInUSD: data.priceInUSD,
      priceInBAND: data.priceInBAND,
      medias: data.medias,
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

      reset({
        title: CurrentBounty?.title,
        priceInUSD: CurrentBounty?.priceInUSD,
        priceInBAND: CurrentBounty?.priceInBand,
        content: CurrentBounty?.description,
        medias: initialMedia, // Set the default medias value
      });
    }
  }, [CurrentBounty, reset]);

  const handleClose = () => {
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
                    value={getValues("content")}
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
                    <div className="flex w-full flex-row gap-2">
                      <input
                        type="number"
                        placeholder="Price in USD $"
                        {...register("priceInUSD", { valueAsNumber: true })}
                        className="input input-bordered w-full "
                      />
                      {errors.priceInUSD && (
                        <div className="label">
                          <span className="label-text-alt text-warning">
                            {errors.priceInUSD.message}
                          </span>
                        </div>
                      )}
                      <input
                        type="number"
                        placeholder="Price in BAND"
                        {...register("priceInBAND", { valueAsNumber: true })}
                        className="input input-bordered w-full"
                      />
                      {errors.priceInBAND && (
                        <div className="label">
                          <span className="label-text-alt text-warning">
                            {errors.priceInBAND.message}
                          </span>
                        </div>
                      )}
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
                          setWantMedia(undefined);
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
