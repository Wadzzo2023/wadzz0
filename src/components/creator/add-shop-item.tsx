import { zodResolver } from "@hookform/resolvers/zod";
import React, { useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "~/utils/api";
import { UploadButton } from "~/utils/uploadthing";
import Image from "next/image";
import toast from "react-hot-toast";

export const ShopItemSchema = z.object({
  name: z.string().min(4, { message: "Required" }),
  description: z.string().min(20, { message: "Make description longer" }),
  AssetName: z
    .string()
    .min(4, { message: "Asset name should be minimum 4" })
    .max(12, { message: "Asset name should be maximum 12" }),
  AssetLimit: z.number().nonnegative().int(),
  price: z.number().nonnegative(),
  mediaUrl: z.string().nullable(),
});

export default function AddItem2Shop() {
  const [medialUrl, setMediaUrl] = React.useState<string>();
  const modalRef = useRef<HTMLDialogElement>(null);
  const mutation = api.shop.createShopAsset.useMutation({
    onSuccess: () => {
      reset();
    },
  });

  const { data: trx } = api.shop.getAssetTrx.useQuery();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<z.infer<typeof ShopItemSchema>>({
    resolver: zodResolver(ShopItemSchema),
    defaultValues: {
      mediaUrl: "test",
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof ShopItemSchema>> = (data) => {
    toast("clicked");
    mutation.mutate(data);
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
          <h3 className="text-lg font-bold">Creat NFT</h3>
          <div>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-2"
            >
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
                  className="textarea textarea-bordered h-24"
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
              <div className="flex h-40 flex-col items-center justify-center gap-2">
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
              </div>

              <div className="bg-base-200">
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
                  onClick={() => {
                    console.log("hi");
                  }}
                  className="btn btn-primary"
                >
                  {mutation.isLoading && (
                    <span className="loading loading-spinner"></span>
                  )}
                  Create Asset
                </button>
              </div>

              <button
                className="btn btn-primary"
                disabled={mutation.isLoading || !trx}
              >
                {mutation.isLoading && (
                  <span className="loading loading-spinner"></span>
                )}
                Add Item
              </button>
            </form>
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
