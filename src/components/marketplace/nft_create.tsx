import { SubmitHandler, useForm, Controller } from "react-hook-form";
// import { PinataResponse, pinFileToIPFS } from "~/lib/pinata/upload";
import { MediaType, Song } from "@prisma/client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { UploadButton } from "~/utils/uploadthing";
import Image from "next/image";
import toast from "react-hot-toast";
import clsx from "clsx";
import { api } from "~/utils/api";
import { clientsign, useConnectWalletStateStore } from "package/connect_wallet";
import { AccountSchema, clientSelect } from "~/lib/stellar/fan/utils";
import { PlusIcon } from "lucide-react";

export const ExtraSongInfo = z.object({
  artist: z.string(),
  albumId: z.number(),
});

export const NftFormSchema = z.object({
  name: z.string(),
  description: z.string(),
  mediaUrl: z.string(),
  coverImgUrl: z.string(),
  mediaType: z.nativeEnum(MediaType),
  price: z.number().nonnegative(),
  limit: z.number().nonnegative().int(),
  code: z
    .string()
    .min(4, { message: "Minimum 4 char" })
    .max(12, { message: "Maximum 12 char" }),
  issuer: AccountSchema.optional(),
  songInfo: ExtraSongInfo.optional(),
});

type NftFormType = z.TypeOf<typeof NftFormSchema>;

export default function NftCreate() {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [mediaType, setMediaType] = useState<MediaType>(MediaType.IMAGE);

  const [mediaUrl, setMediaUrl] = useState<string>();
  const [coverUrl, setCover] = useState<string>();
  const { needSign, pubkey, walletType } = useConnectWalletStateStore();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    control,
  } = useForm<z.infer<typeof NftFormSchema>>({
    resolver: zodResolver(NftFormSchema),
    defaultValues: {
      mediaType: MediaType.IMAGE,
      mediaUrl: "https://picsum.photos/202/200",
      coverImgUrl: "https://picsum.photos/200/200",
    },
  });

  const addAsset = api.fan.asset.createAsset.useMutation({
    onSuccess: () => toast.success("NFT Created"),
  });

  const xdrMutation = api.fan.trx.createUniAssetTrx.useMutation({
    onSuccess(data, variables, context) {
      if (true) {
        const { issuer, xdr } = data;
        console.log(xdr, "xdr");
        setValue("issuer", issuer);
        clientsign({
          presignedxdr: xdr,
          pubkey,
          walletType,
          test: clientSelect(),
        })
          .then((res) => {
            if (res) {
              const data = getValues();
              // res && addMutation.mutate(data);
              addAsset.mutate(data);
            } else {
              toast.error("Transaction Failed");
            }
          })
          .catch((e) => console.log(e));
      }

      // const formData = getValues();
      // setValue("issuer", data.issuer);
      // // res && addMutation.mutate(data);
      // addAsset.mutate(formData);
      // toast.success("NFT Created");
    },
  });

  // Function to upload the selected file to Pinata

  const onSubmit: SubmitHandler<z.infer<typeof NftFormSchema>> = (data) => {
    xdrMutation.mutate({
      code: data.code,
      limit: data.limit,
      signWith: needSign(),
      // ipfsHash: "test",
    });
  };

  console.log("errors", errors);
  console.log("mediaUrl", getValues("mediaType"));

  function getEndpoint(mediaType: MediaType) {
    switch (mediaType) {
      case MediaType.IMAGE:
        return "imageUploader";
      case MediaType.MUSIC:
        return "musicUploader";
      case MediaType.VIDEO:
        return "videoUploader";
      default:
        return "imageUploader";
    }
  }
  function handleMediaChange(media: MediaType) {
    setMediaType(media);
    setValue("mediaType", media);
    setMediaUrl(undefined);
  }
  const handleModal = () => {
    modalRef.current?.showModal();
  };

  return (
    <>
      <dialog className="modal" ref={modalRef}>
        <div className="modal-box">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button
              className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
              // onClick={handleCloseClick}
            >
              ✕
            </button>
          </form>
          <h3 className="text-lg font-bold">Add Asset</h3>
          <p className="py-4">What it is</p>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              <div className="rounded-md bg-base-200 p-2">
                <ul className="menu menu-vertical rounded-box bg-base-200 lg:menu-horizontal">
                  {Object.values(MediaType).map((media, i) => (
                    <li key={i}>
                      <p
                        className={media == mediaType ? "active" : ""}
                        onClick={() => handleMediaChange(media)}
                      >
                        {media}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="rounded-md bg-base-200 p-2">
                  <label className="label font-bold">Media Info</label>
                  <div className="w-full max-w-xs">
                    <label className="label">Name</label>
                    <input
                      minLength={2}
                      required
                      {...register("name")}
                      className="input input-bordered input-sm  w-full"
                      placeholder="Enter NFT Name"
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
                    <label className="label">Description</label>
                    <input
                      {...register("description")}
                      className="input input-bordered input-sm  w-full"
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

                  <label className="label font-bold">Upload Files</label>
                  <div className="form-control w-full max-w-xs">
                    <label className="label">
                      <span className="label-text">
                        Choose a thumbnail. (this will be used as NFT Image)
                      </span>
                    </label>

                    <div className="mt-4">
                      <UploadButton
                        endpoint="imageUploader"
                        content={{
                          button: "Add Thumbnail",
                          allowedContent: "Max (4MB)",
                        }}
                        onClientUploadComplete={(res) => {
                          // Do something with the response
                          // alert("Upload Completed");
                          const data = res[0];

                          if (data?.url) {
                            setCover(data.url);
                            setValue("coverImgUrl", data.url);
                          }
                          // updateProfileMutation.mutate(res);
                        }}
                        onUploadError={(error: Error) => {
                          // Do something with the error.
                          alert(`ERROR! ${error.message}`);
                        }}
                      />

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

                    <div className="form-control w-full max-w-xs">
                      <label className="label">
                        <span className="label-text">
                          Choose your media (required)
                        </span>
                      </label>

                      <UploadButton
                        endpoint={getEndpoint(mediaType)}
                        content={{
                          button: "Add media",
                        }}
                        onClientUploadComplete={(res) => {
                          // Do something with the response
                          // alert("Upload Completed");
                          const data = res[0];

                          if (data?.url) {
                            setMediaUrl(data.url);
                            setValue("mediaUrl", data.url);
                          }
                          // updateProfileMutation.mutate(res);
                        }}
                        onUploadError={(error: Error) => {
                          // Do something with the error.
                          alert(`ERROR! ${error.message}`);
                        }}
                      />

                      <PlayableMedia
                        mediaType={mediaType}
                        mediaUrl={mediaUrl}
                      />
                    </div>
                  </div>
                </div>

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
                            "input input-bordered input-sm  w-full",
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
                          className="input input-bordered input-sm  w-full"
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
                        <span className="label-text">Price</span>
                        <span className="label-text-alt">
                          Default price is 2XLM
                        </span>
                      </label>
                      <input
                        step="0.1"
                        type="number"
                        {...register("price", { valueAsNumber: true })}
                        className="input input-bordered input-sm  w-full"
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
                  </div>
                </>
              </div>

              <input className="btn btn-primary btn-sm mt-4" type="submit" />
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
      <button onClick={handleModal}>
        <PlusIcon />
      </button>
    </>
  );
}

function PlayableMedia({
  mediaUrl,
  mediaType,
}: {
  mediaUrl?: string;
  mediaType: MediaType;
}) {
  return (
    mediaUrl && <MediaComponent mediaType={mediaType} mediaUrl={mediaUrl} />
  );

  function MediaComponent({
    mediaType,
    mediaUrl,
  }: {
    mediaType: MediaType;
    mediaUrl: string;
  }) {
    switch (mediaType) {
      case MediaType.IMAGE:
        return <Image alt="vong" src={mediaUrl} width={100} height={100} />;
      case MediaType.MUSIC:
        return (
          <audio controls>
            <source src={mediaUrl} type="audio/mpeg" />
          </audio>
        );
      case MediaType.VIDEO:
        return (
          <video controls>
            <source src={mediaUrl} type="video/mp4" />
          </video>
        );
    }
  }
}