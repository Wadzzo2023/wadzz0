import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { clientsign } from "package/connect_wallet";
import React, { useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { PLATFORM_ASSET, PLATFORM_FEE } from "~/lib/stellar/constant";
import { AccountSchema, clientSelect } from "~/lib/stellar/fan/utils";
import { api } from "~/utils/api";

import Alert from "../../ui/alert";
import { UploadS3Button } from "~/pages/test";

export const ShopItemSchema = z.object({
  name: z.string().min(4, { message: "Minimum 4 Required" }),
  description: z.string().min(5, { message: "Make description longer" }),
  AssetName: z
    .string()
    .min(4, { message: "Asset name should be minimum 4" })
    .max(12, { message: "Asset name should be maximum 12" }),
  limit: z.number({
    required_error: "Limit  must be a number",
    invalid_type_error: "Limit must be a number",
  }).nonnegative().int(),
  price: z.number({
    required_error: "Price  must be a number",
    invalid_type_error: "Price must be a number",
  }).nonnegative(),
  mediaUrl: z.string().optional(),
  thumbnail: z.string().optional(),
  issuer: AccountSchema.optional(),
});

export default function AddItem2Shop() {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [medialUrl, setMediaUrl] = React.useState<string>();
  const [thumbnail, setThumbnail] = React.useState<string>();
  const [step, setStep] = React.useState(1);
  const session = useSession();

  const assetAmount = api.fan.trx.getAssetNumberforXlm.useQuery();

  const addMutation = api.fan.asset.createAsset.useMutation({
    onSuccess: () => {
      toast.success("Item created successfully!");
      reset();
    },
  });

  const xdrMutation = api.fan.trx.createAssetTrx.useMutation({
    onSuccess(data, variables, context) {
      if (data) {
        const { issuer, xdr } = data;
        setValue("issuer", issuer);
        if (xdr) {
          clientsign({
            presignedxdr: xdr,
            pubkey: session.data?.user.id,
            walletType: session.data?.user.walletType,
            test: clientSelect(),
          })
            .then((res) => {
              const data = getValues();
              // res && addMutation.mutate(data);
            })
            .catch((e) => console.log(e));
        } else {
          // console.log("Error happened");
        }
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
    getValues,
    reset,
  } = useForm<z.infer<typeof ShopItemSchema>>({
    resolver: zodResolver(ShopItemSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof ShopItemSchema>> = (data) => {
    xdrMutation.mutate({
      code: getValues("AssetName"),
      limit: getValues("limit"),
    });
  };



  const handleModal = () => {
    modalRef.current?.showModal();
  };

  return (
    <>
      <button className="btn  btn-primary" onClick={handleModal}>
        <Plus />
        Create NFT Asset
      </button>
      <dialog id="my_modal_1" className="modal" ref={modalRef}>
        <div className="modal-box">
          <h3 className="mb-10 text-center text-lg font-bold">Creat NFT</h3>

          <div className="mt-4 ">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col items-center gap-2 rounded-md bg-base-300 p-4"
            >
              <ItemInfo />

              <AssetInfo />

              <UploadMedia />

              <button
                className="btn btn-primary"
                disabled={addMutation.isLoading || addMutation.isSuccess}
              >
                {addMutation.isLoading && (
                  <span className="loading loading-spinner"></span>
                )}
                Add Item
              </button>
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
      </div>
    );
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
            {...register("limit", { valueAsNumber: true })}
            className="input input-bordered w-full max-w-xs"
            type="number"
            step="1"
            min="1"
            placeholder="Limit"
          ></input>
          {errors.limit && (
            <div className="label">
              <span className="label-text-alt text-warning">
                {errors.limit.message}
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
        <div className="max-w-xs">
          <Alert
            content={`To create a Item, you'll need ${assetAmount.data} ${PLATFORM_ASSET.code} for your Asset account. Additionally, there's a platform fee of ${PLATFORM_FEE} ${PLATFORM_ASSET.code}.`}
          />
        </div>
      </div>
    );
  }

  function UploadMedia() {
    return (
      <>
        <div className="mt-4">

          <UploadS3Button
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              const data = res;

              if (data?.url) {
                setThumbnail(data.url);
                setValue("thumbnail", data.url);
              }
            }}
            onUploadError={(error: Error) => {
              // Do something with the error.
              toast.error(`ERROR! ${error.message}`);

            }}
          />


        </div>
        <div className="flex h-40 w-full flex-col items-center justify-center gap-2">
          {thumbnail && (
            <Image src={thumbnail} alt="d" height={100} width={100} />
          )}
        </div>
      </>
    );
  }
}
