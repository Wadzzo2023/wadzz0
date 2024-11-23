import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { Loader } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { match } from "ts-pattern";
import { z } from "zod";
import { useCreatorStorageAcc } from "~/lib/state/wallete/stellar-balances";
import { useMapModalStore } from "~/pages/maps";
import { api } from "~/utils/api";
import { BADWORDS } from "~/utils/banned-word";
import { error, loading, success } from "~/utils/trcp/patterns";
import { UploadButton } from "~/utils/uploadthing";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/shadcn/ui/dialog";

type AssetType = {
  id: number;
  code: string;
  issuer: string;
  thumbnail: string;
};

export const PAGE_ASSET_NUM = -10;
export const NO_ASSET = -99;

export const createPinFormSchema = z.object({
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
  startDate: z.date(),
  endDate: z.date().min(new Date(new Date().setHours(0, 0, 0, 0))),
  url: z.string().url().optional(),
  autoCollect: z.boolean(),
  token: z.number().optional(),
  tokenAmount: z.number().nonnegative().optional(), // if it optional then no token selected
  pinNumber: z.number().nonnegative().min(1),
  radius: z.number().nonnegative(),
  pinCollectionLimit: z.number().min(0),
  tier: z.string().optional(),
});

export default function CreatePinModal() {
  // hooks

  const { manual, position, duplicate, isOpen, setIsOpen, prevData } =
    useMapModalStore();
  const [coverUrl, setCover] = useState<string>();
  const [selectedToken, setSelectedToken] = useState<
    AssetType & { bal: number }
  >();
  const [isPageAsset, setIsPageAsset] = useState<boolean>();
  const { getAssetBalance } = useCreatorStorageAcc();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    getValues,
    reset,
    watch,
    formState: { errors },
    control,
  } = useForm<z.infer<typeof createPinFormSchema>>({
    resolver: zodResolver(createPinFormSchema),
    defaultValues: {
      lat: position?.lat,
      lng: position?.lng,
      radius: 0,
      pinNumber: 1,
      description: prevData?.description,
      // startDate: new Date(),
      // endDate: new Date(),
    },
    // mode: "onTouched",
  });

  // query
  const assets = api.fan.asset.myAssets.useQuery(undefined, {});
  const tiers = api.fan.member.getAllMembership.useQuery();

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

  function TiersOptions() {
    // console.log("tiers", tiers);
    if (tiers.isLoading) return <div className="skeleton h-10 w-20"></div>;
    if (tiers.data) {
      return (
        <Controller
          name="tier"
          control={control}
          render={({ field }) => (
            <select {...field} className="select select-bordered ">
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

  const openPopup = () => setIsOpen(true);
  const closePopup = () => {
    setIsOpen(false);
    resetState();
  };

  // mutations
  const addPinM = api.maps.pin.createPin.useMutation({
    onSuccess: () => {
      toast.success("Pin sent for approval");
      closePopup();
    },
  });

  // functions
  function resetState() {
    setCover(undefined);
    setSelectedToken(undefined);
    setIsPageAsset(undefined);

    reset();
  }

  // console.log("e", errors);

  const onSubmit: SubmitHandler<z.infer<typeof createPinFormSchema>> = (
    data,
  ) => {
    setValue("token", selectedToken?.id);

    if (selectedToken) {
      if (data.pinCollectionLimit > selectedToken.bal) {
        setError("pinCollectionLimit", {
          type: "manual",
          message: "Collection limit can't be more than token balance",
        });
        return;
      }
    }

    if (position) {
      setValue("lat", position.lat);
      setValue("lng", position.lng);

      addPinM.mutate({ ...data, lat: position.lat, lng: position.lng });
    } else {
      // toast.error("Please select a location on the map");
      addPinM.mutate({ ...data });
    }
  };

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

  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    if (duplicate) {
      if (prevData) {
        if (prevData.title) {
          setValue("title", prevData.title);
        }
        if (prevData.description) {
          setValue("description", prevData.description);
        }
        if (prevData.image) {
          setCover(prevData.image);
        }
        if (prevData.startDate) {
          setValue("startDate", prevData.startDate);
        }
        if (prevData.endDate) {
          setValue("endDate", prevData.endDate);
        }
        if (prevData.url) {
          setValue("url", prevData.url);
        }
        if (prevData.autoCollect) {
          setValue("autoCollect", prevData.autoCollect);
        }
        if (prevData.pinCollectionLimit) {
          setValue("pinCollectionLimit", prevData.pinCollectionLimit);
        }
        if (prevData.token) {
          handleTokenOptionChange({
            target: { value: prevData.token.toString() },
          } as ChangeEvent<HTMLSelectElement>);
        }

        if (prevData.tier) {
          setValue("tier", prevData.tier);
        }
        if (prevData.image) {
          setCover(prevData.image);
        }

        if (prevData.pinNumber) {
          setValue("pinNumber", prevData.pinNumber);
        }
      }
    }

    if (position) {
      setValue("lat", position.lat);
      setValue("lng", position.lng);
    }
  }, [isOpen]);
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {/* <DialogTrigger asChild>
          <Button onClick={openPopup}>Open Popup</Button>
        </DialogTrigger> */}
        <DialogContent className=" m-auto flex max-h-[90vh] w-full max-w-2xl flex-col">
          <DialogHeader>
            <DialogTitle>Create Pin</DialogTitle>
            <DialogDescription>
              Create manual and specific pin hot spot
            </DialogDescription>
          </DialogHeader>
          <div
            ref={scrollContainerRef}
            className="flex-grow overflow-y-auto px-6"
          >
            <div className="pr-4">
              <form className="mt-5" onSubmit={handleSubmit(onSubmit)}>
                <h2 className="mb-2 text-center text-lg font-bold"></h2>
                <div className="flex flex-col space-y-4">
                  <ManualLatLanInputField />
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
                    <label htmlFor="radius" className="text-sm font-medium">
                      Radius (meters)
                    </label>
                    <input
                      min={0}
                      type="number"
                      id="radius"
                      {...register("radius", { valueAsNumber: true })}
                      className="input input-bordered"
                    />
                    {errors.radius && (
                      <p className="text-red-500">{errors.radius.message}</p>
                    )}
                  </div>

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
                      id="startDate"
                      {...register("startDate", { valueAsDate: true })}
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
                      {...register("endDate", { valueAsDate: true })}
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
                    disabled={addPinM.isLoading}
                  >
                    {addPinM.isLoading && <Loader className="animate-spin" />}
                    Submit
                  </button>
                  {addPinM.isError && (
                    <p className="text-red-500">
                      {addPinM.failureReason?.message}
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* <Button onClick={closePopup}>Close Popup</Button> */}
        </DialogContent>
      </Dialog>
    </>
  );

  // components

  function AvailableTokenField({ balance }: { balance?: number }) {
    return (
      <>
        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">
              How many token you want to drop ?
            </span>
          </div>
          <input
            disabled={!selectedToken}
            step={1}
            type="number"
            {...register("tokenAmount", {
              valueAsNumber: true,
            })}
            placeholder="eg. 1000"
            className="input input-bordered w-full max-w-xs"
          />
          {balance ? (
            <span className="label-text text-xs">
              *Note: Can{"'t"} more than limit remaining
            </span>
          ) : (
            <></>
          )}
          {errors.tokenAmount && (
            <div className="label">
              <span className="label-text-alt text-red-500">
                {errors.tokenAmount.message}
              </span>
            </div>
          )}
          {/* {tokenAmount > selectedToken.bal && (
              <span className="label-text-alt text-red-500">
                {"Insufficient balance"}
              </span>
            )} */}
        </label>
      </>
    );
  }

  function AssetTypeTab() {
    const pageAsset = assets.data?.pageAsset;
    return (
      <div role="tablist" className="tabs-boxed tabs max-w-xs">
        <a
          role="tab"
          className={clsx("tab", isPageAsset && "tab-active")}
          onClick={() => {
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
                id: 0,
                thumbnail: pageAsset.thumbnail ?? "",
              });
              // setValue("token", pageAsset);
            } else {
              toast.error("No page asset found");
              // setSelectedToken(undefined);
              // setIsPageAsset(undefined);
            }

            if (isPageAsset === false) {
              setIsPageAsset(true);
            }
            if (isPageAsset === true) {
              setSelectedToken(undefined);
              setIsPageAsset(undefined);
            }
            if (isPageAsset === undefined) {
              setIsPageAsset(true);
            }
          }}
        >
          Page Asset
        </a>
        <a
          role="tab"
          className={clsx("tab", isPageAsset === false && "tab-active")}
          onClick={() => {
            setSelectedToken(undefined);

            if (isPageAsset === false) {
              setIsPageAsset(undefined);
              setSelectedToken(undefined);
            }
            if (isPageAsset === undefined) {
              setIsPageAsset(false);
            }
            if (isPageAsset == true) {
              setIsPageAsset(false);
            }
          }}
        >
          Shop Asset
        </a>
      </div>
    );
  }

  function ManualLatLanInputField() {
    if (manual)
      return (
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
      );
    else
      return (
        <p>
          Latitude: <span className="text-blue-500">{position?.lat}</span>
          <br></br>
          Longitude: <span className="text-blue-500">{position?.lng}</span>
        </p>
      );
  }
}

function TokenInStorage({ bal }: { bal: number }) {
  return <p className="text-sm text-red-400">Limit Remaining : {bal}</p>;
}
