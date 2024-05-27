import { zodResolver } from "@hookform/resolvers/zod";
import { Maximize } from "lucide-react";
import React, { ChangeEvent, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { api } from "~/utils/api";
import { match } from "ts-pattern";
import { error, empty, loading, success } from "~/utils/trcp/patterns";
import clsx from "clsx";
import { useCreatorStorageAcc } from "~/lib/state/wallete/stellar-balances";
import { STROOP } from "~/lib/stellar/marketplace/constant";

type AssetType = {
  id: number;
  code: string;
  issuer: string;
  thumbnail: string;
};

export const createPinFormSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  description: z.string(),
  title: z.string().min(3),
  image: z.string().url().optional(),
  startDate: z.date().min(new Date(new Date().setHours(0, 0, 0, 0))),
  endDate: z.date().min(new Date()),
  autoCollect: z.boolean(),
  token: z.number(),
  tokenAmount: z.number().nonnegative(),
  pinNumber: z.number().nonnegative().min(2),
  radius: z.number().nonnegative().default(10),
  pinCollectionLimit: z.number().min(0),
  isSinglePin: z.boolean().default(true),
});

export default function CreatePinModal({
  modal,
  position,
}: {
  modal: React.RefObject<HTMLDialogElement>;
  position?: google.maps.LatLngLiteral;
}) {
  // hooks
  const [isSinglePin, setIsSinglePin] = useState(true);
  const [selectedToken, setSelectedToken] = useState<
    AssetType & { bal: number }
  >();
  const { getAssetBalance } = useCreatorStorageAcc();
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
    },
    mode: "onTouched",
  });

  // query
  const assets = api.fan.asset.myAssets.useQuery(undefined, {});
  const assetsDropdown = match(assets)
    .with(success, () => (
      <label className="form-control w-full max-w-xs">
        <div className="label">
          <span className="label-text">Choose Token</span>
        </div>
        <select
          className="select select-bordered"
          onChange={handleTokenOptionChange}
        >
          <option disabled defaultChecked>
            Pick one
          </option>
          {assets.data?.map((asset: AssetType) => (
            <option key={asset.id} value={asset.id}>
              {asset.code}
            </option>
          ))}
        </select>
      </label>
    ))
    .with(loading, (data) => <p>Loading...</p>)
    .with(error, (data) => <p>{data.failureReason?.message}</p>)
    .otherwise(() => <p>Failed to fetch assets</p>);

  // mutations

  const addPinM = api.maps.pin.createPin.useMutation({
    onSuccess: () => {
      reset();
      modal.current?.close();
      toast.success("Pin created successfully");
    },
  });

  // functions
  function resetState() {
    reset();
  }

  console.log("e", errors);

  const onSubmit: SubmitHandler<z.infer<typeof createPinFormSchema>> = (
    data,
  ) => {
    // set other value
    if (position) {
      setValue("isSinglePin", isSinglePin);
      setValue("lat", position.lat);
      setValue("lng", position.lng);
      addPinM.mutate(data);
    } else {
      toast.error("Please select a location on the map");
    }
  };

  function handleTokenOptionChange(
    event: ChangeEvent<HTMLSelectElement>,
  ): void {
    const selectedAssetId = Number(event.target.value);
    const selectedAsset = assets.data?.find(
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
  return (
    <>
      <dialog className="modal" ref={modal}>
        <div className="modal-box">
          <form method="dialog">
            <button
              className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
              onClick={() => resetState()}
            >
              ✕
            </button>
          </form>
          <form className="mt-5" onSubmit={handleSubmit(onSubmit)}>
            <h2 className="mb-2 text-center text-lg font-bold">Create Pin</h2>
            <div className="flex flex-col space-y-4">
              <p>
                Latitude: <span className="text-blue-500">{position?.lat}</span>
                <br></br>
                Longitude:{" "}
                <span className="text-blue-500">{position?.lng}</span>
              </p>

              <div className="flex justify-between">
                {assetsDropdown}
                {selectedToken && <TokenInStorage bal={selectedToken.bal} />}
              </div>

              <AvailableTokenField />

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
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  {...register("description")}
                  className="input input-bordered"
                />
                {errors.description && (
                  <p className="text-red-500">{errors.description.message}</p>
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
                // onClick={handleSubmit((data) => console.log(data))}
              >
                {addPinM.isLoading ? (
                  <div className="flex justify-center">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  "Submit"
                )}
                Submit
              </button>
            </div>
          </form>

          <div className="modal-action">
            <form method="dialog">
              <button className="btn" onClick={() => resetState()}>
                Close
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );

  // components
  function MultipinField() {
    if (!isSinglePin)
      return (
        <>
          <div className="flex flex-col space-y-2">
            <label htmlFor="radius" className="text-sm font-medium">
              Radius
            </label>
            <input
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
              Pin Number
            </label>
            <input
              type="number"
              id="pinNumber"
              {...register("pinNumber", { valueAsNumber: true })}
              className="input input-bordered"
            />
            {errors.pinNumber && (
              <p className="text-red-500">{errors.pinNumber.message}</p>
            )}
          </div>
        </>
      );
  }
  function AvailableTokenField() {
    const tokenAmount = watch("tokenAmount");
    if (selectedToken) {
      return (
        <>
          <label className="form-control w-full">
            <div className="label">
              <span className="label-text">
                How many token you want to drop ?
              </span>
            </div>
            <input
              step={Number(STROOP)}
              type="number"
              {...register("tokenAmount", {
                valueAsNumber: true,
              })}
              placeholder="eg. 1000"
              className="input input-bordered w-full max-w-xs"
            />
            {errors.tokenAmount && (
              <div className="label">
                <span className="label-text-alt text-red-500">
                  {errors.tokenAmount.message}
                </span>
              </div>
            )}
            {tokenAmount > selectedToken.bal && (
              <span className="label-text-alt text-red-500">
                {"Insufficient balance"}
              </span>
            )}
          </label>

          <div role="tablist" className="tabs-boxed tabs max-w-xs">
            <a
              role="tab"
              className={clsx("tab", isSinglePin && "tab-active")}
              onClick={() => setIsSinglePin(true)}
            >
              Single Pin
            </a>
            <a
              role="tab"
              className={clsx("tab", !isSinglePin && "tab-active")}
              onClick={() => setIsSinglePin(false)}
            >
              Multipin
            </a>
          </div>

          <MultipinField />

          <label className="form-control w-full">
            <div className="label">
              <span className="label-text">
                How many user can collect a pin?
              </span>
            </div>

            <input
              type="number"
              id="perUserTokenAmount"
              {...register("pinCollectionLimit", { valueAsNumber: true })}
              className="input input-bordered"
            />
            {errors.pinCollectionLimit && (
              <div className="label">
                <span className="label-text-alt text-red-500">
                  {errors.pinCollectionLimit.message}
                </span>
              </div>
            )}
          </label>
        </>
      );
    }
  }
}

function TokenInStorage({ bal }: { bal: number }) {
  return <p>{bal}</p>;
}
