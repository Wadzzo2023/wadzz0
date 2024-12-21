import { zodResolver } from "@hookform/resolvers/zod";
import { MediaType } from "@prisma/client";
import clsx from "clsx";
import { PlusIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { clientsign } from "package/connect_wallet";
import { WalletType } from "package/connect_wallet/src/lib/enums";
import { ChangeEvent, useRef, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Dialog, DialogContent } from "~/components/shadcn/ui/dialog";
import useNeedSign from "~/lib/hook";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { PLATFORM_ASSET, PLATFORM_FEE } from "~/lib/stellar/constant";
import { AccountSchema, clientSelect } from "~/lib/stellar/fan/utils";
import { api } from "~/utils/api";
import { UploadButton } from "~/utils/uploadthing";
import { useModal } from "../../lib/state/play/use-modal-store";
import Alert from "../ui/alert";
import Loading from "../wallete/loading";
import { ipfsHashToUrl } from "~/utils/ipfs";

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
  price: z
    .number({
      required_error: "Price must be entered as a number",
      invalid_type_error: "Price must be entered as a number",
    })
    .nonnegative(),
  priceUSD: z
    .number({
      required_error: "Limit must be entered as a number",
      invalid_type_error: "Limit must be entered as a number",
    })
    .nonnegative(),
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
  songInfo: ExtraSongInfo.optional(),
  isAdmin: z.boolean().optional(),
  tier: z.string().optional(),
});

export default function NftCreateOld({ admin: isAdmin }: { admin?: true }) {
  const requiredToken = api.fan.trx.getRequiredPlatformAsset.useQuery({
    xlm: 2.5,
  });

  if (requiredToken.isLoading) return <Loading />;

  if (requiredToken.data) {
    const requiredTokenAmount = requiredToken.data + Number(PLATFORM_FEE);
    return (
      <div className="">
        <NftCreateForm
          admin={isAdmin}
          requiredTokenAmount={requiredTokenAmount}
        />
      </div>
    );
  }
}

function NftCreateForm({
  admin: isAdmin,
  requiredTokenAmount,
}: {
  admin?: true;
  requiredTokenAmount: number;
}) {
  const session = useSession();
  const { isOpen, onClose, type } = useModal();
  const { platformAssetBalance } = useUserStellarAcc();
  // pinta upload
  const [file, setFile] = useState<File>();
  const [ipfs, setCid] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const isModalOpen = isOpen && type === "nft create";
  const inputFile = useRef(null);
  // other
  const modalRef = useRef<HTMLDialogElement>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [mediaType, setMediaType] = useState<MediaType>(MediaType.IMAGE);

  const [mediaUrl, setMediaUrl] = useState<string>();
  const [coverUrl, setCover] = useState<string>();
  const { needSign } = useNeedSign();

  const connectedWalletType = session.data?.user.walletType ?? WalletType.none;
  const walletType = isAdmin ? WalletType.isAdmin : connectedWalletType;

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors },
    control,
  } = useForm<z.infer<typeof NftFormSchema>>({
    resolver: zodResolver(NftFormSchema),
    defaultValues: {
      mediaType: MediaType.IMAGE,
      mediaUrl: "https://picsum.photos/202/200",
    },
  });

  // console.log("errors", errors);

  const tiers = api.fan.member.getAllMembership.useQuery();

  const addAsset = api.fan.asset.createAsset.useMutation({
    onSuccess: () => {
      toast.success("NFT Created", {
        position: "top-center",
        duration: 4000,
        style: {
          backgroundColor: "green",
          color: "white",
          width: "100%",
          padding: "0.5rem 1rem",
          margin: "1rem 1rem",
        },
      });
      reset();
    },
  });

  const xdrMutation = api.fan.trx.createUniAssetTrx.useMutation({
    onSuccess(data, variables, context) {
      const { issuer, xdr } = data;
      setValue("issuer", issuer);

      setSubmitLoading(true);

      toast.promise(
        clientsign({
          presignedxdr: xdr,
          pubkey: session.data?.user.id,
          walletType,
          test: clientSelect(),
        })
          .then((res) => {
            if (res) {
              setValue("isAdmin", isAdmin);
              const data = getValues();
              // res && addMutation.mutate(data);

              addAsset.mutate(data);
            } else {
              toast.error("Transaction Failed");
            }
          })
          .catch((e) => console.log(e))
          .finally(() => setSubmitLoading(false)),
        {
          loading: "Signing Transaction",
          success: "",
          error: "Signing Transaction Failed",
        },
      );
    },
  });

  // Function to upload the selected file to Pinata

  const onSubmit: SubmitHandler<z.infer<typeof NftFormSchema>> = (data) => {
    if (ipfs)
      xdrMutation.mutate({
        code: data.code,
        limit: data.limit,
        signWith: needSign(isAdmin),
        ipfsHash: ipfs,
      });
  };

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
      setValue("coverImgUrl", thumbnail);
      setCid(ipfsHash);
      toast.success("Thumbnail uploaded successfully");

      setUploading(false);
    } catch (e) {
      console.log(e);
      setUploading(false);
      toast.error("Failed to upload file");
    }
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
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

  function TiersOptions() {
    if (tiers.isLoading) return <div className="skeleton h-10 w-20"></div>;
    if (tiers.data) {
      return (
        <Controller
          name="tier"
          control={control}
          render={({ field }) => (
            <select {...field} className="select select-bordered ">
              <option selected disabled>
                Choose Tier
              </option>
              {tiers.data.map((model) => (
                <option
                  key={model.id}
                  value={model.id}
                >{`${model.name} - ${model.price}`}</option>
              ))}
            </select>
          )}
        />
      );
    }
  }

  const handleClose = () => {
    reset();
    onClose();
  };
  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="  ">
          <h3 className="text-lg font-bold">Add Asset</h3>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              <div className="bg-base-200 p-2">
                <div className="flex justify-between">
                  <div className="">
                    <ul className="menu menu-vertical rounded-box bg-base-300 lg:menu-horizontal">
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
                  </div>

                  {isAdmin ? <> </> : <TiersOptions />}
                </div>

                <div className="rounded-md bg-base-200 p-2">
                  <label className="label font-bold">Media Info</label>
                  <div className="w-full max-w-xs">
                    <label className="label">Name</label>
                    <input
                      minLength={2}
                      required
                      {...register("name")}
                      className="input input-sm input-bordered  w-full"
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

                  <label className="label font-bold">Upload Files</label>
                  <div className="form-control w-full max-w-xs">
                    <label className="label">
                      <span className="label-text">
                        Choose a thumbnail Max 1MB (this will be used as NFT
                        Image)
                      </span>
                    </label>

                    <div className="mt  ">
                      <input
                        type="file"
                        id="file"
                        accept=".jpg, .png"
                        ref={inputFile}
                        onChange={handleChange}
                        className=""
                      />
                      {uploading && (
                        <progress className="progress w-56"></progress>
                      )}
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
                        appearance={{
                          button:
                            "text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center ",
                          container:
                            "p-1 w-max flex-row rounded-md border-cyan-300 bg-slate-800",
                          allowedContent:
                            "flex h-8 flex-col items-center justify-center px-2 text-white",
                        }}
                        content={{ button: "Add Media" }}
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
                        <span className="label-text">Price</span>
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
                        {/* <span className="label-text-alt"></span> */}
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
                  </div>
                </>
              </div>
              <div>
                <Alert
                  type={
                    requiredTokenAmount > platformAssetBalance
                      ? "warning"
                      : "normal"
                  }
                  content={`You need minimum ${requiredTokenAmount} ${PLATFORM_ASSET.code}`}
                />
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={
                  xdrMutation.isLoading ||
                  addAsset.isLoading ||
                  submitLoading ||
                  requiredTokenAmount > platformAssetBalance
                }
              >
                {(xdrMutation.isLoading ||
                  addAsset.isLoading ||
                  submitLoading) && (
                  <span className="loading loading-spinner"></span>
                )}
                Create Asset
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <button className="btn btn-primary" onClick={handleModal}>
        <PlusIcon /> Item
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
