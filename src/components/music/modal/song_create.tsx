import { SubmitHandler, useForm } from "react-hook-form";
// import { PinataResponse, pinFileToIPFS } from "~/lib/pinata/upload";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { PlusIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { WalletType, clientsign } from "package/connect_wallet";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { z } from "zod";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { AccountSchema } from "~/lib/stellar/fan/utils";
import { api } from "~/utils/api";

import { ipfsHashToUrl } from "~/utils/ipfs";
import { UploadS3Button } from "~/pages/test";

export const SongFormSchema = z.object({
  name: z.string(),
  artist: z.string(),
  musicUrl: z.string(),
  description: z.string(),
  coverImgUrl: z.string(), // its last part is the ipfs hash
  albumId: z.number(),
  price: z
    .number({
      required_error: "Limit must be entered as a number",
      invalid_type_error: "Limit must be entered as a number",
    })
    .nonnegative(),
  priceUSD: z.number({
    required_error: "Price  must be a number",
    invalid_type_error: "Price must be a number",
  }).nonnegative(),
  limit: z
    .number({
      required_error: "Limit must be entered as a number",
      invalid_type_error: "Limit must be entered as a number",
    })
    .nonnegative(),
  code: z
    .string()
    .min(4, { message: "Must be a minimum of 4 characters" })
    .max(12, { message: "Must be a maximum of 12 characters" }),
  issuer: AccountSchema.optional(),
  tier: z.string().optional(),
});

type SongFormType = z.TypeOf<typeof SongFormSchema>;

export default function SongCreate({ albumId }: { albumId: number }) {
  // pinta upload
  const [file, setFile] = useState<File>();
  const [ipfs, setIpfs] = useState<string>();
  const [uploading, setUploading] = useState(false);

  const inputFile = useRef(null);
  const modalRef = useRef<HTMLDialogElement>(null);

  const [musicUrl, setMusicUrl] = useState<string>();
  const [coverImgUrl, setCover] = useState<string>();
  const session = useSession();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors },
    control,
  } = useForm<z.infer<typeof SongFormSchema>>({
    resolver: zodResolver(SongFormSchema),
    defaultValues: { albumId, price: 2, priceUSD: 2 },
  });

  const addSong = api.music.song.create.useMutation({
    onSuccess: () => {
      toast.success("Song added");
      modalRef.current?.close();

      reset();
    },
  });

  const xdrMutation = api.music.steller.getMusicAssetXdr.useMutation({
    onSuccess(data, variables, context) {
      const { issuer, xdr } = data;
      setValue("issuer", issuer);
      const toastId = toast.loading("signing transaction...");
      clientsign({
        presignedxdr: xdr,
        pubkey: session.data?.user.id,
        walletType: WalletType.isAdmin,
      })
        .then((res) => {
          if (res) {
            const data = getValues();
            addSong.mutate(data);
          } else {
            toast.error(
              "Transection failed in Steller Network. Please try again.",
            );
          }
        })
        .catch((e) => {
          console.log(e);
          toast.error("Error in signing transaction. Please try again.");
        })
        .finally(() => toast.dismiss(toastId));

      // const { issuer, xdr } = data;
      // setValue("issuer", issuer);
      // const formData = getValues();
      // // res && addMutation.mutate(data);
      // addSong.mutate(formData);
    },
    onError(err, variables, context) {
      toast.error("Error");

    },
  });

  // Function to upload the selected file to Pinata

  const onSubmit: SubmitHandler<z.infer<typeof SongFormSchema>> = (data) => {
    if (ipfs) {
      xdrMutation.mutate({
        code: data.code,
        limit: data.limit,
        ipfsHash: ipfs,
      });
    } else {
      toast.error("Please upload a thumbnail image.");
    }
  };


  const handleModal = () => {
    modalRef.current?.showModal();
  };

  const uploadFile = async (fileToUpload: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", fileToUpload, fileToUpload.name);
      // console.log("formData", fileToUpload);
      const res = await fetch("/api/file", {
        method: "POST",
        body: formData,
      });
      const ipfsHash = await res.text();
      const thumbnail = ipfsHashToUrl(ipfsHash);
      setCover(thumbnail);
      setIpfs(ipfsHash);
      setValue("coverImgUrl", thumbnail);

      setUploading(false);
    } catch (e) {
      console.log(e);
      setUploading(false);
      alert("Trouble uploading file");
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      if (files.length > 0) {
        const file = files[0];
        if (file) {
          if (file.size > 1024 * 1024) {
            toast.error("File size should be less than 1MB");
            return;
          }
          setFile(file);
          await uploadFile(file);
        }
      }
    }
  };

  return (
    <>
      <dialog className="modal" ref={modalRef}>
        <div className="modal-box">
          <form method="dialog">
            <button
              className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
            // onClick={handleCloseClick}
            >
              ✕
            </button>
          </form>
          <h3 className="text-lg font-bold">Admin Music Asset</h3>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              <div className="rounded-md bg-base-200 p-2">
                <div className="rounded-md bg-base-200 p-2">
                  <label className="label font-bold">Song Info</label>
                  <div className="w-full max-w-xs">
                    <label className="label">Name</label>
                    <input
                      minLength={2}
                      required
                      {...register("name")}
                      className="input input-sm input-bordered  w-full"
                      placeholder="Enter Music Name"
                    />
                    {errors.name && (
                      <label className="label">
                        <span className="label-text-alt text-warning">
                          {errors.name.message}
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="w-full max-w-xs">
                    <label className="label">Artist</label>
                    <input
                      {...register("artist")}
                      className="input input-sm input-bordered  w-full"
                      placeholder="Enter Artist Name"
                    />
                  </div>
                </div>
                <label className="label font-bold">Upload Files</label>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">
                      Choose a thumbnail. (this will be used as NFT Image)
                      {errors.coverImgUrl && (
                        <span className="text-warning">`(is requried)`</span>
                      )}
                    </span>
                  </label>

                  <div className="mt-4">
                    <input
                      type="file"
                      id="file"
                      accept=".jpg, .png"
                      ref={inputFile}
                      onChange={handleChange}
                    />
                    {uploading && (
                      <progress className="progress w-56"></progress>
                    )}
                    {coverImgUrl && (
                      <>
                        <Image
                          className="p-2"
                          width={120}
                          height={120}
                          alt="preview image"
                          src={coverImgUrl}
                        />
                      </>
                    )}
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text ">
                        Choose your music{" "}
                        <span className="text-red-600">* requried</span>
                      </span>
                    </label>


                    <UploadS3Button
                      endpoint="musicUploader"
                      onClientUploadComplete={(res) => {
                        const data = res;

                        if (data?.url) {
                          setMusicUrl(data.url);
                          setValue("musicUrl", data.url);
                        }
                      }}
                      onUploadError={(error: Error) => {
                        // Do something with the error.
                        toast.error(`ERROR! ${error.message}`);
                      }}
                    />

                    {musicUrl && (
                      <>
                        <audio controls className="py-2">
                          <source src={musicUrl} type="audio/mpeg" />
                        </audio>
                      </>
                    )}
                    {
                      errors.musicUrl && (
                        <label className="label">
                          <span className="label-text-alt text-warning">
                            {errors.musicUrl.message}
                          </span>
                        </label>
                      )
                    }
                  </div>
                </div>

                <div className="w-full max-w-xs"></div>

                <>
                  <div className="rounded-md bg-base-200 p-2">
                    <label className="label  font-bold">NFT Info</label>

                    <>
                      <div className="w-full max-w-xs ">
                        <label className="label">
                          <span className="label-text">Asset Name</span>
                          <span className="label-text-alt">
                            You can&apos;t change it later
                          </span>
                        </label>
                        <input
                          {...register("code")}
                          className={clsx(
                            "input input-sm input-bordered  w-full",
                            errors.code && "input-warning",
                          )}
                          placeholder="Enter Asset Name"
                        />
                        {errors.code && (
                          <label className="label">
                            <span className="label-text-alt text-warning">
                              {errors.code.message}
                            </span>
                          </label>
                        )}
                      </div>
                      <div className=" w-full max-w-xs ">
                        <label className="label">
                          <span className="label-text">Limit</span>
                          <span className="label-text-alt">
                            Default limit would be 1
                          </span>
                        </label>
                        <input
                          // disabled={trxdata?.successful ? true : false}
                          type="number"
                          {...register("limit", { valueAsNumber: true })}
                          className="input input-sm input-bordered  w-full"
                          placeholder="Enter limit of the new Asset"
                        />
                        {errors.limit && (
                          <div className="label">
                            <span className="label-text-alt">
                              {errors.limit.message}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                    <div className="w-full max-w-xs">
                      <label className="label">
                        <span className="label-text">
                          Price in {PLATFORM_ASSET.code}
                        </span>
                        <span className="label-text-alt">
                          Default price is 2 {PLATFORM_ASSET.code}
                        </span>
                      </label>
                      <input
                        step="0.1"
                        type="number"
                        {...register("price", { valueAsNumber: true })}
                        className="input input-sm input-bordered  w-full"
                        placeholder="Price"
                      />
                      {errors.price && (
                        <div className="label">
                          <span className="label-text-alt">
                            {errors.price.message}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="w-full max-w-xs">
                      <label className="label">
                        <span className="label-text">Price in USD</span>
                        <span className="label-text-alt">
                          Default price is 2$
                        </span>
                      </label>
                      <input
                        step="0.1"
                        type="number"
                        {...register("priceUSD", { valueAsNumber: true })}
                        className="input input-sm input-bordered  w-full"
                        placeholder="Price"
                      />
                      {errors.priceUSD && (
                        <div className="label">
                          <span className="label-text-alt">
                            {errors.priceUSD.message}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="w-full max-w-xs">
                      <label className="label">Description</label>
                      <input
                        {...register("description")}
                        className="input input-sm input-bordered  w-full"
                        placeholder="Write a short Description"
                      />
                      {errors.description && (
                        <div className="label">
                          <span className="label-text-alt">
                            {errors.description.message}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={xdrMutation.isLoading || addSong.isLoading}
              >
                {(xdrMutation.isLoading || addSong.isLoading) && (
                  <span className="loading loading-spinner"></span>
                )}
                Add Music Asset
              </button>
            </div>
          </form>

          <div className="modal-action">
            <form method="dialog">
              <button
                className="btn"
              // onClick={handleCloseClick}
              >
                Close
              </button>
            </form>
          </div>
        </div>
      </dialog>
      <button className="btn btn-circle" onClick={handleModal}>
        <PlusIcon />
      </button>
    </>
  );
}
