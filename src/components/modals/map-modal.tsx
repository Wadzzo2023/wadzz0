import {
  CheckCheck,
  Copy,
  Edit3,
  InfoIcon,
  Loader2,
  Scissors,
  ShieldBan,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import React from "react";
import toast from "react-hot-toast";
import { Button } from "~/components/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/shadcn/ui/dialog";
import { api } from "~/utils/api";
import { ModalData, useModal } from "../../lib/state/play/use-modal-store";


import { useRouter } from "next/router";
import { IPin, useMapModalStore } from "~/pages/maps";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "~/components/shadcn/ui/input";

import { Label } from "~/components/shadcn/ui/label";
import { UploadButton } from "~/utils/uploadthing";

const MapModalComponent = () => {
  const {
    isOpen,
    onClose,
    type,
    data,
    isPinCopied,
    setIsPinCopied,
    isAutoCollect,
    setIsPinCut,
  } = useModal();
  const [isForm, setIsForm] = React.useState(false);
  // console.log(data.long, data.lat, data.pinId);
  const session = useSession();
  const router = useRouter();
  const [pinData, setPinData] = React.useState<IPin>();

  const { setManual, setDuplicate, setPosition, setIsOpen, setPrevData } =
    useMapModalStore();
  const isModalOpen = isOpen && type === "map";
  const handleClose = () => {
    onClose();
  };

  const pinM = api.maps.pin.getPinM.useMutation({
    onSuccess: (data) => {
      setPrevData(data as IPin);
      handleDuplicatePin();

      toast.success("Pin duplicated successfully");
    },
  });

  const pinE = api.maps.pin.getPinM.useMutation({
    onSuccess: (data) => {
      setPinData(data as IPin);
      setIsForm(!isForm);
    },
  });

  // const []= useState()

  const ToggleAutoCollectMutation = api.maps.pin.toggleAutoCollect.useMutation({
    onSuccess: (data) => {
      toast.success("Auto collect disabled successfully");
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleToggleAutoCollect = async (pinId: string | undefined) => {
    if (pinId) {
      // console.log(pinId);
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
      // console.log("handleCopyPin", data?.pinId);
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
      // console.log("handleDelete", data?.pinId);
      toast.success("Pin deleted successfully");
      handleClose();
    } else {
      toast.error("Pin Id not found");
    }
  };

  const handleCutPin = () => {
    if (data?.pinId) {
      // console.log("handleCutPin", data?.pinId);
      toast.success("Pin Id copied to clipboard");
      setIsPinCut(true);
    } else {
      toast.error("Pin Id not found");
    }
  };

  if (!session?.data?.user?.id) {
    return <div>Public Key not found</div>;
  }
  function handleDuplicatePin(): void {
    handleClose();
    setManual(true);
    setDuplicate(true);
    setIsOpen(true);
  }
  console.log("data",data)
  if (data)
    return (
      <>
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
          <DialogContent className="overflow-hidden p-0">
            <>
              <DialogHeader className="px-6 pt-8">
                <DialogTitle className="flex items-center justify-center gap-2  ">
                  <h2 className="text-center text-2xl font-bold">
                    {data?.mapTitle}{" "}
                  </h2>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setIsForm(!isForm)
                     
                    }}
                  >
                    <Edit3 />
                  </Button>
                </DialogTitle>
              </DialogHeader>
              {isForm && data.pinId  ? (
                <div className="px-3">
                  <PinInfoUpdate
                  id={data.pinId}
                  image={data.image}
                  description={data.mapDescription ?? "Description"}
                  title={data.mapTitle ?? "No Title"}
                  startDate={data?.startDate}
                  endDate={data?.endDate}
                  collectionLimit={data?.pinCollectionLimit}

                />
                </div>
              ) : (
                <PinInfo data={data} />
              )}
            </>
            {!isForm && (
              <div className="mt-4 flex flex-col items-center justify-center md:mt-0">
                <Button className="m-1 w-1/2 " onClick={handleDelete}>
                  <Trash2 size={15} className="mr-2" /> Delete Pin
                </Button>
                <Button
                  className="m-1 w-1/2 "
                  onClick={() => {
                    data.pinId && pinM.mutate(data.pinId);
                  }}
                >
                  {pinM.isLoading ? (
                    <Loader2 className="animate animate-spin" />
                  ) : (
                    <Copy size={15} className="mr-2" />
                  )}{" "}
                  Duplicate pins
                </Button>
                <Button className="m-1 w-1/2 " onClick={handleCopyPin}>
                  <Copy size={15} className="mr-2" /> Copy Pin
                </Button>
                <Button className="m-1 w-1/2 " onClick={handleCutPin}>
                  <Scissors size={15} className="mr-2" /> Cut Pin
                </Button>
                <Button
                  className="m-1 w-1/2 "
                  onClick={() => {
                    router
                      .push(`maps/pins/${data.pinId}`)
                      .finally(() => handleClose());
                  }}
                >
                  <InfoIcon size={15} className="mr-2" /> Show collectors
                </Button>
                {isAutoCollect ? (
                  <Button
                    className="m-1 w-1/2 "
                    onClick={() => handleToggleAutoCollect(data.pinId)}
                  >
                    <ShieldCheck size={15} className="mr-2" /> Disable Auto
                    Collect
                  </Button>
                ) : (
                  <Button
                    className="m-1 w-1/2 "
                    onClick={() => handleToggleAutoCollect(data.pinId)}
                  >
                    <ShieldBan size={15} className="mr-1" /> Enable Auto Collect
                  </Button>
                )}
              </div>
            )}
            <DialogFooter className=" px-6 py-4"></DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
};
export default MapModalComponent;

function PinInfo({
  data,
}: {
  data: {
    mapDescription?: string | null;
    long?: number;
    lat?: number;
    image?: string;
  };
}) {
  return (
    <div className="flex flex-col items-center">
      {data.mapDescription && (
        <div className="text-sm">{data.mapDescription}</div>
      )}
      <div>Long: {data.long}</div>
      <div>Lat: {data.lat}</div>
      <div className="flex justify-center">
        {data.image && (
          <Image
            src={data.image}
            alt="image"
            width={200}
            height={200}
            className="rounded-lg"
          />
        )}
      </div>
    </div>
  );
}
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  collectionLimit:z.number().optional()
});

type FormData = z.infer<typeof formSchema>;
function PinInfoUpdate({
  image,
  description,
  title,
  id,
  startDate,
  endDate,
  collectionLimit
}: {
  image?: string;
  title: string;
  description: string;
  id: string;
  startDate?: Date;
  endDate?: Date;
  collectionLimit?: number;
}) {
  const [coverUrl, setCover] = React.useState(image);
  const { data, updateData } = useModal();
  const utils = api.useUtils();
  console.log('collectionrm',collectionLimit)

  const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    collectionLimit: z.number().min(0, "Collection limit must be non-negative"),
    startDate: z.date(),
    endDate: z.date().min(new Date(), "End date must be in the future"),
    image: z.string().optional()
  });

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title,
      description,
      collectionLimit: collectionLimit ?? 0, 
      startDate: startDate ?? undefined,
      endDate: endDate ?? undefined, 
      image:image
    },
  });

  const update = api.maps.pin.updatePin.useMutation({
    onSuccess: async (updatedData) => {
      updateData({
        ...data,
       
      });

      await utils.maps.pin.getMyPins.refetch();
    },
  });

  const onSubmit = (formData:FormData) => {
    console.log(formData)
    update.mutate({
      pinId: id,
      title: formData.title,
      description: formData.description,
      endDate: formData.endDate,
      startDate: formData.startDate,
      imgUrl: coverUrl ,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded bg-slate-200 p-3 space-y-4">
      <div className="space-y-2 ">
        <Label htmlFor="title">Title</Label>
        <Controller
          name="title"
          control={control}
          render={({ field }) => <Input {...field} placeholder="Edit Title" />}
        />
        {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => <Input {...field} placeholder="Edit Description" />}
        />
        {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="collectionLimit">Collection Limit</Label>
        <Controller
          name="collectionLimit"
          control={control}
          render={({ field }) => (
            <Input
              type="number"
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          )}
        />
        {errors.collectionLimit && <p className="text-red-500 text-sm">{errors.collectionLimit.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">Start Date</Label>
        <Controller
          name="startDate"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Input
              type="date"
              onChange={(e) => onChange(new Date(e.target.value))}
              value={value instanceof Date ? value.toISOString().split('T')[0] : ''}
            />
          )}
        />
        {errors.startDate && <p className="text-red-500 text-sm">{errors.startDate.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="endDate">End Date</Label>
        <Controller
          name="endDate"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Input
              type="date"
              onChange={(e) => onChange(new Date(e.target.value))}
              value={value instanceof Date ? value.toISOString().split('T')[0] : ''}
            />
          )}
        />
        {errors.endDate && <p className="text-red-500 text-sm">{errors.endDate.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Cover Image</Label>
        <UploadButton
          endpoint="imageUploader"
          content={{
            button: "Add Cover",
            allowedContent: "Max (4MB)",
          }}
          onClientUploadComplete={(res) => {
            const data = res[0];
            if (data?.url) {
              setCover(data.url);
            }
          }}
          onUploadError={(error: Error) => {
            alert(`ERROR! ${error.message}`);
          }}
        />
        {coverUrl && (
          <Image
            className="mt-2"
            width={120}
            height={120}
            alt="preview image"
            src={coverUrl}
          />
        )}
      </div>

      <Button
        type="submit"
        disabled={update.isLoading || update.isSuccess}
        className="w-full"
      >
        {update.isLoading && <Loader2 className="animate-spin mr-2" />}
        {update.isSuccess && <CheckCheck className="mr-2" />}
        Update
      </Button>
    </form>
  );
}

