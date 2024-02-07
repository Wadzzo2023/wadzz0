import { zodResolver } from "@hookform/resolvers/zod";
import React, { useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "~/utils/api";
import { UploadButton } from "~/utils/uploadthing";
import Image from "next/image";
import toast from "react-hot-toast";
import clsx from "clsx";
import { clientsign, useConnectWalletStateStore } from "package/connect_wallet";
import { Keypair } from "stellar-sdk";
import { AccounSchema } from "~/lib/stellar/utils";

export const ShopItemSchema = z.object({
  name: z.string().min(4, { message: "Required" }),
  description: z.string().min(5, { message: "Make description longer" }),
  AssetName: z
    .string()
    .min(4, { message: "Asset name should be minimum 4" })
    .max(12, { message: "Asset name should be maximum 12" }),
  AssetLimit: z.number().nonnegative().int(),
  price: z.number().nonnegative(),
  mediaUrl: z.string().nullable(),
  issuer: AccounSchema,
});

export default function AddItem2Shop() {
  const modalRef = useRef<HTMLDialogElement>(null);

  const [medialUrl, setMediaUrl] = React.useState<string>();
  const [xdr, setXdr] = React.useState<string>();
  const [step, setStep] = React.useState(1);

  const { isAva, pubkey, walletType, uid, email } =
    useConnectWalletStateStore();

  const addMutation = api.shop.createShopAsset.useMutation({
    onSuccess: () => {
      toast.success("Item created successfully!");
      reset();
    },
  });

  const xdrMutation = api.trx.createAssetTrx.useMutation({
    onSuccess(data, variables, context) {
      if (data) {
        setXdr(data.xdr);
        setValue("issuer", data.issuer);
        setStep(3);
      } else {
        toast.error("Error happened");
      }
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    trigger,
    reset,
  } = useForm<z.infer<typeof ShopItemSchema>>({
    resolver: zodResolver(ShopItemSchema),
    defaultValues: {
      mediaUrl: "test",
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof ShopItemSchema>> = (data) => {
    if (xdr && !addMutation.isSuccess) {
      clientsign({
        presignedxdr: xdr,
        pubkey,
        walletType,
        test: true,
      })
        .then((res) => {
          res && addMutation.mutate(data);
        })
        .catch((e) => console.log(e));
    }
  };

  const handleModal = () => {
    modalRef.current?.showModal();
  };

  console.log(errors, "errors");

  return (
    <>
      <button className="btn" onClick={handleModal}>
        Creat NFT Item
      </button>
      <dialog id="my_modal_1" className="modal" ref={modalRef}>
        <div className="modal-box">
          <h3 className="mb-10 text-center text-lg font-bold">Creat NFT</h3>
          <Steps />

          <div className="mt-4 ">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col items-center gap-2 rounded-md bg-base-300 p-4"
            >
              {step == 1 && <ItemInfo />}

              {step == 2 && <AssetInfo />}

              {step == 3 && (
                <button
                  className="btn btn-primary"
                  disabled={
                    addMutation.isLoading || !xdr || addMutation.isSuccess
                  }
                >
                  {addMutation.isLoading && (
                    <span className="loading loading-spinner"></span>
                  )}
                  Add Item
                </button>
              )}
            </form>
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button className="btn" disabled={addMutation.isLoading}>
                Close
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );

  function ItemInfo() {
    return (
      <div className="flex w-full flex-col items-center">
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Name</span>
          </div>
          <input
            type="text"
            placeholder="Enter Name"
            {...register("name")}
            className="input input-bordered w-full max-w-xs"
          />
          {errors.name && (
            <div className="label">
              <span className="label-text-alt text-warning">
                {errors.name.message}
              </span>
            </div>
          )}
        </label>
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Description</span>
          </div>
          <textarea
            {...register("description")}
            className="textarea textarea-bordered h-24 "
            placeholder="Description"
          ></textarea>
          {errors.description && (
            <div className="label">
              <span className="label-text-alt text-warning">
                {errors.description.message}
              </span>
            </div>
          )}
        </label>
        <div className="flex h-40 w-full flex-col items-center justify-center gap-2">
          {medialUrl && (
            <Image src={medialUrl} alt="d" height={100} width={100} />
          )}
          <UploadButton
            endpoint="imageUploader"
            content={{ button: "Change Photo" }}
            onClientUploadComplete={(res) => {
              // Do something with the response
              console.log("Files: ", res);
              // alert("Upload Completed");
              const data = res[0];

              if (data?.url) {
                setMediaUrl(data.url);
                // setValue("mediaType", MediaType.IMAGE);
                setValue("mediaUrl", data.url);
                // updateProfileMutation.mutate(data.url);
              }
              // updateProfileMutation.mutate(res);
            }}
            onUploadError={(error: Error) => {
              // Do something with the error.
              alert(`ERROR! ${error.message}`);
            }}
          />
          <button
            type="button"
            className="btn btn-primary w-full max-w-xs "
            // disabled={isNameDesError()}
            onClick={async () => {
              const isOk = await triggerErrorInInf();
              if (isOk) {
                if (step < 3) {
                  setStep(step + 1);
                }
              }
            }}
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  async function triggerErrorInInf() {
    return await trigger(["name", "description"]);
  }

  function isNameDesError() {
    // toast.error("Error happened");
    if (errors.name ?? errors.description) {
      return true;
    } else {
      return false;
    }
  }
  function isAssetInfoError() {
    if (errors.AssetLimit ?? errors.AssetName ?? errors.price) return true;
    else false;
  }
  async function triggerErroInAssetInfo() {
    return await trigger(["AssetName", "AssetLimit", "price"]);
  }

  function AssetInfo() {
    return (
      <div className="flex w-full flex-col items-center gap-3">
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Asset Name</span>
          </div>
          <input
            {...register("AssetName")}
            className="input input-bordered w-full max-w-xs"
            placeholder="Asset Name"
          ></input>
          {errors.AssetName && (
            <div className="label">
              <span className="label-text-alt text-warning">
                {errors.AssetName.message}
              </span>
            </div>
          )}
        </label>
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Asset Limit</span>
          </div>
          <input
            {...register("AssetLimit", { valueAsNumber: true })}
            className="input input-bordered w-full max-w-xs"
            type="number"
            step="1"
            min="1"
            placeholder="Limit"
          ></input>
          {errors.AssetLimit && (
            <div className="label">
              <span className="label-text-alt text-warning">
                {errors.AssetLimit.message}
              </span>
            </div>
          )}
        </label>
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Price</span>
          </div>
          <input
            {...register("price", { valueAsNumber: true })}
            className="input input-bordered w-full max-w-xs"
            type="number"
            step="1"
            min="1"
            placeholder="Price"
          ></input>
          {errors.price && (
            <div className="label">
              <span className="label-text-alt text-warning">
                {errors.price.message}
              </span>
            </div>
          )}
        </label>
        <button
          type="button"
          disabled={xdrMutation.isLoading || !!xdr || xdrMutation.isSuccess}
          onClick={async () => {
            const isOk = await triggerErroInAssetInfo();
            if (isOk) {
              xdrMutation.mutate();
            }
          }}
          className="btn btn-primary mt-2 w-full max-w-xs"
        >
          {xdrMutation.isLoading && (
            <span className="loading loading-spinner"></span>
          )}
          Create Asset
        </button>
      </div>
    );
  }
  function Steps() {
    return (
      <ul className="steps w-full border-b border-base-300">
        <li
          className={clsx(
            "step",
            step > 0 && (isNameDesError() ? "step-warning" : "step-primary"),
          )}
          onClick={() => setStep(1)}
        >
          Item Info
        </li>
        <li
          className={clsx(
            "step",
            step > 1 && (isAssetInfoError() ? "step-warning" : "step-primary"),
          )}
          onClick={() => triggerErrorInInf().then((ok) => ok && setStep(2))}
        >
          Asset Info
        </li>
        <li
          className={clsx("step", step > 2 && "step-primary")}
          onClick={() =>
            step == 2 &&
            xdr &&
            triggerErroInAssetInfo().then((ok) => ok && setStep(3))
          }
        >
          Confirm
        </li>
      </ul>
    );
  }
}
