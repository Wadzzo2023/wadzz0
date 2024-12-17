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
  token: z.number().optional(),
  pinNumber: z.number().nonnegative().min(1),
  pinCollectionLimit: z.number().min(0),
  tier: z.string().optional(),
  multiPin: z.boolean().optional(),
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
      pinCollectionLimit: collectionLimit ?? 1,
      startDate: startDate, // Pass the raw Date object
      endDate: endDate, // Pass the raw Date object
      image: image,
      autoCollect: autoCollect ?? false,
      multiPin: multiPin ?? false,
      tier: privacy === "PUBLIC" ? "public" : privacy === "PRIVATE" ? "private" : privacy,
      pinId: id,
      lat: lat ?? 0,
      lng: long ?? 0,
      pinNumber: pinNumber ?? 1,
      url: link ?? "",
      token: assetId ?? 0,
      tokenAmount: 0,
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

    if (selectedToken && data.pinCollectionLimit) {
      if (data.pinCollectionLimit > selectedToken.bal) {
        setError("pinCollectionLimit", {
          type: "manual",
          message: "Collection limit can't be more than token balance",
        });
        return;
      }
    }

    update.mutate(formData);

  };
  function TiersOptions() {
    // console.log("tiers", tiers);
    if (tiers.isLoading) return <div className="skeleton h-10 w-20"></div>;
    if (tiers.data) {
      return (
        <Controller
          name="tier"
          control={control}
          render={({ field }) => (
            <select {...field} className="select select-bordered "
              defaultValue={privacy === "PUBLIC" ? "public" : privacy === "PRIVATE" ? "private" : Number(privacy)}
            >
              <option disabled>Choose Tier</option>
              <option value="public">Public</option>
              <option value="private">Only Followers</option>
              {tiers.data.map((model) => (
                <option
                  key={model.id}
                  value={model.id}
                >{`${model.name} : ${model.price} ${model.creator.pageAsset?.code}`}</option>
              ))}
            </select>
          )}
        />
      );
    }
  }
  function handleTokenOptionChange(
    event: ChangeEvent<HTMLSelectElement>,
  ): void {
    // toast(event.target.value);
    const selectedAssetId = Number(event.target.value);
    if (selectedAssetId === NO_ASSET) {
      setSelectedToken(undefined);
      return;
    }
    if (selectedAssetId === PAGE_ASSET_NUM) {
      const pageAsset = assets.data?.pageAsset;

      if (pageAsset) {
        const bal = getAssetBalance({
          code: pageAsset.code,
          issuer: pageAsset.issuer,
        });
        setSelectedToken({
          bal,
          code: pageAsset.code,
          issuer: pageAsset.issuer,
          id: PAGE_ASSET_NUM,
          thumbnail: pageAsset.thumbnail ?? "",
        });
      } else {
        toast.error("No page asset found");
      }
    }

    const selectedAsset = assets.data?.shopAsset.find(
      (asset) => asset.id === selectedAssetId,
    );
    if (selectedAsset) {
      const bal = getAssetBalance({
        code: selectedAsset.code,
        issuer: selectedAsset.issuer,
      });
      setSelectedToken({ ...selectedAsset, bal: bal });
      setValue("token", selectedAsset.id);
    }
  }
  const assetsDropdown = match(assets)
    .with(success, () => {
      const pageAsset = assets.data?.pageAsset;
      const shopAsset = assets.data?.shopAsset;

      if (isPageAsset && pageAsset) {
        return <p>{pageAsset.code}</p>;
      }
      // if (isPageAsset === false && shopAsset)
      if (true)
        return (
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Choose Token</span>
            </div>
            <select
              className="select select-bordered"
              onChange={handleTokenOptionChange}
              defaultValue={assetId}
            >
              <option value={NO_ASSET}>Pin (No asset)</option>
              <option value={PAGE_ASSET_NUM}>
                {pageAsset?.code} - Page Asset
              </option>
              {assets.data?.shopAsset.map((asset: AssetType) => (
                <option key={asset.id} value={asset.id}>
                  {asset.code}
                </option>
              ))}
            </select>
          </label>
        );
    })
    .with(loading, (data) => <p>Loading...</p>)
    .with(error, (data) => <p>{data.failureReason?.message}</p>)
    .otherwise(() => <p>Failed to fetch assets</p>);
  useEffect(() => {
    // Only load the media from the server on the first load
    if (image && isInitialLoad) {
      setCover(image ?? []);

      setIsInitialLoad(false); // After loading, mark initial load as done
    }
  }, [image, isInitialLoad]);

  useEffect(() => {
    if (assetId) {
      if (assetId === PAGE_ASSET_NUM) {
        const pageAsset = assets.data?.pageAsset;

        if (pageAsset) {
          const bal = getAssetBalance({
            code: pageAsset.code,
            issuer: pageAsset.issuer,
          });
          setSelectedToken({
            bal,
            code: pageAsset.code,
            issuer: pageAsset.issuer,
            id: PAGE_ASSET_NUM,
            thumbnail: pageAsset.thumbnail ?? "",
          });
        }
      } else {
        const selectedAsset = assets.data?.shopAsset.find(
          (asset) => asset.id === assetId,
        );
        if (selectedAsset) {
          const bal = getAssetBalance({
            code: selectedAsset.code,
            issuer: selectedAsset.issuer,
          });
          setSelectedToken({ ...selectedAsset, bal: bal });
        }
      }
    }
  }, [assetId, assets.data]);

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
        <div>
          <label
            htmlFor="description"
            className="mr-2 text-sm font-medium"
          >
            Choose tier
          </label>
          <TiersOptions />
        </div>
        <div className="flex justify-between">{assetsDropdown}</div>
        <div>
          {selectedToken && (
            <TokenInStorage bal={selectedToken.bal} />
          )}
        </div>
        {/* <AvailableTokenField balance={selectedToken?.bal} /> */}



        <div className="flex flex-col space-y-2">
          <label htmlFor="pinNumber" className="text-sm font-medium">
            Number of pins
          </label>
          <input
            type="number"
            min={1}
            id="pinNumber"
            {...register("pinNumber", { valueAsNumber: true })}
            className="input input-bordered"
          />
          {errors.pinNumber && (
            <p className="text-red-500">{errors.pinNumber.message}</p>
          )}
        </div>

        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">Collection limit</span>
          </div>

          <input
            type="number"
            defaultValue={1}
            id="perUserTokenAmount"
            {...register("pinCollectionLimit", {
              valueAsNumber: true,
              min: 1,
              max: 2147483647,
            })} // default value
            className="input input-bordered"
            max={2147483647}
          />

          {errors.pinCollectionLimit && (
            <div className="label">
              <span className="label-text-alt text-red-500">
                {errors.pinCollectionLimit.message}
              </span>
            </div>
          )}
        </label>

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

        <div className="flex flex-col space-y-2">
          <label htmlFor="startDate" className="text-sm font-medium">
            Start Date
          </label>
          <input
            type="date"
            value={startDate ? startDate.toISOString().split("T")[0] : ""}
            onChange={(e) => setValue("startDate", new Date(e.target.value))} // Convert input back to Date
            id="startDate"

            className="input input-bordered"
          />
          {errors.startDate && (
            <p className="text-red-500">{errors.startDate.message}</p>
          )}
        </div>
        <div className="flex flex-col space-y-2">
          <label htmlFor="endDate" className="text-sm font-medium">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate ? endDate.toISOString().split("T")[0] : ""}
            onChange={(e) => setValue("endDate", new Date(e.target.value))}
            className="input input-bordered"
          />
          {errors.endDate && (
            <p className="text-red-500">{errors.endDate.message}</p>
          )}
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

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="multiPin"
            {...register("multiPin")}
            className="checkbox"
          />
          <label htmlFor="autoCollect" className="text-sm">
            Multi Pin
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

function TokenInStorage({ bal }: { bal: number }) {
  return <p className="text-sm text-red-400">Limit Remaining : {bal}</p>;
}

