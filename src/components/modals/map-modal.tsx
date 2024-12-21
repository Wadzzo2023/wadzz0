import {
  CheckCheck,
  Copy,
  Edit3,
  InfoIcon,
  Loader,
  Loader2,
  Scissors,
  ShieldBan,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import React, { ChangeEvent, useEffect, useState } from "react";
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
import { match } from "ts-pattern";


import { useRouter } from "next/router";
import { IPin, useMapModalStore } from "~/pages/maps";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "~/components/shadcn/ui/input";
import { error, loading, success } from "~/utils/trcp/patterns";

import { Label } from "~/components/shadcn/ui/label";
import { UploadButton } from "~/utils/uploadthing";
import { BADWORDS } from "~/utils/banned-word";
import { Select } from "../shadcn/ui/select";
import { NO_ASSET, PAGE_ASSET_NUM } from "../maps/modals/create-pin";
import { useCreatorStorageAcc } from "~/lib/state/wallete/stellar-balances";
import { ItemPrivacy } from "@prisma/client";

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
    setIsOpen(false);
    setIsForm(false);
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
  console.log("data", data)
  if (data)
    return (
      <>
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
          <DialogContent className="overflow-y-auto max-h-[750px] p-0">
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
              {isForm && data.pinId ? (
                <div className="px-3">
                  <PinInfoUpdate
                    autoCollect={data.autoCollect}
                    multiPin={data.multiPin}

                    lat={data.lat}
                    long={data.long}
                    id={data.pinId}
                    image={data.image}
                    pageAsset={data.pageAsset}
                    description={data.mapDescription ?? "Description"}
                    title={data.mapTitle ?? "No Title"}
                    startDate={data?.startDate}
                    endDate={data?.endDate}
                    collectionLimit={data?.pinCollectionLimit}
                    pinNumber={data?.pinNumber}
                    link={data.link}
                    assetId={data.assetId}
                    privacy={data.privacy}

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

type AssetType = {
  id: number;
  code: string;
  issuer: string;
  thumbnail: string;
};

const updateMapFormSchema = z.object({
  pinId: z.string(),
  lat: z
    .number({
      message: "Latitude is required",
    })
    .min(-180)
    .max(180),
  lng: z
    .number({
      message: "Longitude is required",
    })
    .min(-180)
    .max(180),
  description: z.string(),
  title: z
    .string()
    .min(3)
    .refine(
      (value) => {
        return !BADWORDS.some((word) => value.includes(word));
      },
      {
        message: "Input contains banned words.",
      },
    ),
  image: z.string().url().optional(),
  startDate: z.date().optional(),
  endDate: z.date().min(new Date(new Date().setHours(0, 0, 0, 0))).optional(),
  url: z.string().url().optional(),
  autoCollect: z.boolean(),

});

type FormData = z.infer<typeof updateMapFormSchema>;

function PinInfoUpdate({
  image,
  description,
  title,
  id,
  startDate,
  endDate,
  collectionLimit,
  multiPin,
  autoCollect,
  lat,
  long,
  pageAsset,
  pinNumber,
  link,
  assetId,
  privacy,

}: {
  image?: string;
  title: string;
  description: string;
  id: string;
  startDate?: Date;
  endDate?: Date;
  collectionLimit?: number;
  multiPin?: boolean;
  autoCollect?: boolean;
  lat?: number;
  long?: number;
  pageAsset?: boolean;
  pinNumber?: number;
  link?: string;
  assetId?: number;
  privacy?: ItemPrivacy;
}) {
  const [coverUrl, setCover] = React.useState("");
  const { data, updateData, onClose } = useModal();
  const utils = api.useUtils();
  console.log('collectionrm', collectionLimit)
  const [isPageAsset, setIsPageAsset] = useState<boolean>();
  const [selectedToken, setSelectedToken] = useState<
    AssetType & { bal: number }
  >();

  const { getAssetBalance } = useCreatorStorageAcc();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { control, handleSubmit, formState: { errors }, register, setError,
    setValue
  } = useForm({
    resolver: zodResolver(updateMapFormSchema),
    defaultValues: {
      title: title ?? "",
      description: description ?? "",
      startDate: startDate,
      endDate: endDate,
      image: image,
      autoCollect: autoCollect ?? false,
      pinId: id,
      lat: lat ?? 0,
      lng: long ?? 0,
      url: link ?? "",
    },
  });
  const tiers = api.fan.member.getAllMembership.useQuery();
  const assets = api.fan.asset.myAssets.useQuery(undefined, {});

  const update = api.maps.pin.updatePin.useMutation({
    onSuccess: async (updatedData) => {


      await utils.maps.pin.getMyPins.refetch();

      toast.success("Pin updated successfully");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const onSubmit = (formData: FormData) => {
    formData.image = coverUrl ?? image;

    update.mutate(formData);

  };


  useEffect(() => {
    // Only load the media from the server on the first load
    if (image && isInitialLoad) {
      setCover(image ?? []);

      setIsInitialLoad(false); // After loading, mark initial load as done
    }
  }, [image, isInitialLoad]);



  return (
    <form className="mt-5" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="mb-2 text-center text-lg font-bold"></h2>
      <div className="flex flex-col space-y-4">
        <div>
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Latitude</label>
            <input
              type="number"
              step={0.0000000000000000001}
              {...register("lat", { valueAsNumber: true })}
              className="input input-bordered"
            />
            {errors.lat && <p className="text-red-500">{errors.lat.message}</p>}
          </div>
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Longitude</label>
            <input
              step={0.0000000000000000001}
              type="number"
              {...register("lng", { valueAsNumber: true })}
              className="input input-bordered"
            />
            {errors.lng && <p className="text-red-500">{errors.lng.message}</p>}
          </div>
        </div>
        <div className="flex flex-col space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Title
          </label>
          <input
            type="text"
            id="title"
            {...register("title")}
            className="input input-bordered"
          />
          {errors.title && (
            <p className="text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div className="flex flex-col space-y-2">
          <label
            htmlFor="description"
            className="text-sm font-medium"
          >
            Description
          </label>
          <textarea
            id="description"
            {...register("description")}
            className="input input-bordered"
          />
          {errors.description && (
            <p className="text-red-500">
              {errors.description.message}
            </p>
          )}
        </div>
        {/* <AssetTypeTab /> */}


        {/* <AvailableTokenField balance={selectedToken?.bal} /> */}







        <div className="mt ">
          <label className="text-sm font-medium">
            Pin Cover Image
          </label>
          <UploadButton
            endpoint="imageUploader"
            content={{
              button: "Add Cover",
              allowedContent: "Max (4MB)",
            }}
            onClientUploadComplete={(res) => {
              // Do something with the response
              // alert("Upload Completed");
              const data = res[0];

              if (data?.url) {
                setCover(data.url);
                setValue("image", data.url);
              }
              // updateProfileMutation.mutate(res);
            }}
            onUploadError={(error: Error) => {
              // Do something with the error.
              alert(`ERROR! ${error.message}`);
            }}
          />

          {/* {uploading && <progress className="progress w-56"></progress>} */}
          {coverUrl && (
            <>
              <Image
                className="p-2"
                width={120}
                height={120}
                alt="preview image"
                src={coverUrl}
              />
            </>
          )}
        </div>

        <div className="flex flex-col space-y-2">
          <label
            htmlFor="description"
            className="text-sm font-medium"
          >
            URL / LINK
          </label>
          <input
            id="url"
            {...register("url")}
            className="input input-bordered"
          />
          {errors.url && (
            <p className="text-red-500">{errors.url.message}</p>
          )}
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
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="autoCollect"
            {...register("autoCollect")}
            className="checkbox"
          />
          <label htmlFor="autoCollect" className="text-sm">
            Auto Collect
          </label>
        </div>

        {/* <div className="flex flex-col space-y-2">
                <label htmlFor="limit" className="text-sm font-medium">
                  Limit
                </label>
                <input
                  type="number"
                  id="limit"
                  {...register("limit", { valueAsNumber: true })}
                  className="input input-bordered"
                />
                {errors.limit && (
                  <p className="text-red-500">{errors.limit.message}</p>
                )}
              </div> */}
        <button
          type="submit"
          className="btn btn-primary"

        >
          {update.isLoading && <Loader className="animate-spin" />}
          Submit
        </button>
        {update.isError && (
          <p className="text-red-500">
            {update.failureReason?.message}
          </p>
        )}
      </div>
    </form>
  );
}

