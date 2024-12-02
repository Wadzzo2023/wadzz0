import { zodResolver } from "@hookform/resolvers/zod";
import { MediaType } from "@prisma/client";
import clsx from "clsx";
import { PlusIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { clientsign } from "package/connect_wallet";
import { WalletType } from "package/connect_wallet/src/lib/enums";
import { ChangeEvent, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";
import useNeedSign from "~/lib/hook";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { PLATFORM_ASSET, PLATFORM_FEE, TrxBaseFeeInPlatformAsset } from "~/lib/stellar/constant";
import { AccountSchema, clientSelect } from "~/lib/stellar/fan/utils";
import { api } from "~/utils/api";
import { BADWORDS } from "~/utils/banned-word";
import { UploadButton } from "~/utils/uploadthing";
import {
  PaymentChoose,
  usePaymentMethodStore,
} from "../payment/payment-options";

import { Button } from "../shadcn/ui/button";
import Alert from "../ui/alert";
import Loading from "../wallete/loading";
import RechargeLink from "./recharge/link";

import { Eye, EyeOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { ipfsHashToUrl } from "~/utils/ipfs";

export const ExtraSongInfo = z.object({
  artist: z.string(),
  albumId: z.number(),
});

export const NftFormSchema = z.object({
  name: z.string().refine(
    (value) => {
      return !BADWORDS.some((word) => value.includes(word));
    },
    {
      message: "Input contains banned words.",
    },
  ),
  description: z.string(),
  mediaUrl: z.string(),
  coverImgUrl: z.string().min(1, { message: "Thumbnail is required" }),
  mediaType: z.nativeEnum(MediaType),
  price: z
    .number({
      required_error: "Price must be entered as a number",
      invalid_type_error: "Price must be entered as a number",
    })
    .nonnegative()
    .default(2),
  priceUSD: z
    .number({
      required_error: "Limit must be entered as a number",
      invalid_type_error: "Limit must be entered as a number",
    })
    .nonnegative()
    .default(1),
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

export default function NftCreate({ admin: isAdmin }: { admin?: true }) {
  const requiredToken = api.fan.trx.getRequiredPlatformAsset.useQuery({
    xlm: 2,
  });

  if (requiredToken.isLoading) return <Loading />;

  if (requiredToken.data) {
    const requiredTokenAmount = requiredToken.data;
    return (
      <NftCreateForm
        admin={isAdmin}
        requiredTokenAmount={requiredTokenAmount}
      />
    );
  }
}

import * as React from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/shadcn/ui/select";

function NftCreateForm({
  admin: isAdmin,
  requiredTokenAmount,
}: {
  admin?: true;
  requiredTokenAmount: number;
}) {
  const session = useSession();
  const { platformAssetBalance } = useUserStellarAcc();
  const [isOpen, setIsOpen] = useState(false);
  const [parentIsOpen, setParentIsOpen] = useState(false);
  // pinta upload
  const [file, setFile] = useState<File>();
  const [ipfs, setCid] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [mediaUpload, setMediaUpload] = useState(false);
  const inputFile = useRef(null);

  // tier options
  const [tier, setTier] = useState<string>();

  // other
  const modalRef = useRef<HTMLDialogElement>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [mediaUploadSuccess, setMediaUploadSuccess] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>(MediaType.IMAGE);

  const [mediaUrl, setMediaUrl] = useState<string>();
  const [coverUrl, setCover] = useState<string>();
  const { needSign } = useNeedSign();

  const connectedWalletType = session.data?.user.walletType ?? WalletType.none;
  const walletType = isAdmin ? WalletType.isAdmin : connectedWalletType;
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const totalFeees = Number(TrxBaseFeeInPlatformAsset) + Number(PLATFORM_FEE);
  const { paymentMethod, setIsOpen: setPaymentModalOpen } =
    usePaymentMethodStore();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors, isValid },
    control,
    trigger,
  } = useForm<z.infer<typeof NftFormSchema>>({
    resolver: zodResolver(NftFormSchema),
    mode: "onChange",
    defaultValues: {
      mediaType: MediaType.IMAGE,
      mediaUrl: "https://picsum.photos/202/200",
      price: 2,
      priceUSD: 1,
    },
  });

  // console.log("errors", errors);

  const tiers = api.fan.member.getAllMembership.useQuery();

  const addAsset = api.fan.asset.createAsset.useMutation({
    onSuccess: () => {
      toast.success("NFT Created", {
        position: "top-center",
        duration: 4000,
      });
      setPaymentModalOpen(false);
      setIsOpen(false);
      setMediaUploadSuccess(false);
      reset();
    },
  });

  const xdrMutation = api.fan.trx.createUniAssetTrx.useMutation({
    onSuccess(data, variables, context) {
      const { issuer, xdr } = data;
      // console.log(xdr, "xdr");
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
              setValue("tier", tier);
              const data = getValues();
              addAsset.mutate({ ...data });
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

  const onSubmit = () => {
    if (ipfs)
      xdrMutation.mutate({
        code: getValues("code"),
        limit: getValues("limit"),
        signWith: needSign(isAdmin),
        ipfsHash: ipfs,
        native: paymentMethod === "xlm",
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
      await trigger();

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

  function onChangeHandler(event: ChangeEvent<HTMLSelectElement>): void {
    toast.success(`${event.currentTarget.value}`);
    setTier(event.currentTarget.value);
  }

  const loading = xdrMutation.isLoading || addAsset.isLoading || submitLoading;
  return (
    <>
      <Dialog open={parentIsOpen} onOpenChange={setParentIsOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">
            <PlusIcon size={16} /> Item
          </Button>
        </DialogTrigger>
        <DialogContent
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
          className=" h-[90%] max-w-xl overflow-auto p-3"
        >
          <DialogHeader className="text-lg font-bold">Add Asset</DialogHeader>
          {/* <button onClick={handleLoL}> LOL</button> */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4 ">
              <div className="rounded-lg bg-base-200  p-2">
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

                  {/* <VisibilityToggle
                    isVisible={isVisible}
                    toggleVisibility={() => setIsVisible(!isVisible)}
                  /> */}
                  {isAdmin ? (
                    <></>
                  ) : (
                    tiers.data && (
                      <TiersOptions
                        handleTierChange={(value: string) => {
                          // toast.success(`${value}`);
                          setTier(value);
                        }}
                        tiers={tiers.data}
                      />
                    )
                  )}
                </div>

                <div className="rounded-md bg-base-200 p-2">
                  <label className="label font-bold">Media Info </label>
                  <div className="w-full max-w-xs">
                    <label className="label">
                      Name <span className="text-red-600">*</span>
                    </label>
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

                  <label className="label text-center font-bold">
                    Upload Files
                  </label>
                  <div className="form-control w-full max-w-xs py-2">
                    <label className="label">
                      <span className="label-text">
                        Choose a thumbnail Max 1MB (this will be used as NFT
                        Image) <span className="text-red-600">*</span>
                      </span>
                    </label>

                    <div className="my-2">
                      <input
                        type="file"
                        id="file"
                        accept=".jpg, .png , .jpeg "
                        ref={inputFile}
                        onChange={handleChange}
                        className=""
                      />{" "}
                      {errors.coverImgUrl && (
                        <div className="label">
                          <span className="label-text-alt">
                            {errors.coverImgUrl.message}
                          </span>
                        </div>
                      )}
                      {uploading && (
                        <progress className="progress w-56"></progress>
                      )}
                      {coverUrl && (
                        <>
                          <Image
                            className="p-2"
                            width={100}
                            height={100}
                            alt="preview image"
                            src={coverUrl}
                          />
                        </>
                      )}
                    </div>

                    <div className="form-control w-full max-w-xs">
                      <div className="label-text flex items-center justify-between py-2">
                        <span>
                          Choose your media{" "}
                          <span className="text-red-600">*</span>
                        </span>
                        {mediaUpload && <p>{uploadProgress}%</p>}
                      </div>

                      <UploadButton
                        endpoint={getEndpoint(mediaType)}
                        onUploadBegin={() => {
                          setMediaUpload(true);
                        }}
                        disabled={mediaUpload}
                        onUploadProgress={(progress) => {
                          setUploadProgress(progress);
                        }}
                        appearance={{
                          button:
                            " w-full text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium  text-sm  text-center ",
                          container:
                            " w-full flex-row rounded-md border-cyan-300 bg-slate-800",
                          allowedContent:
                            "flex h-8 flex-col items-center justify-center px-2 text-white",
                        }}
                        content={{
                          button: mediaUpload
                            ? `UPLOADING TO ${process.env.NEXT_PUBLIC_SITE}`
                            : mediaUploadSuccess
                              ? "FILE UPLOAD SUCCESS"
                              : "UPLOAD MEDIA",
                        }}
                        onClientUploadComplete={(res) => {
                          // Do something with the response
                          // alert("Upload Completed");
                          const data = res[0];

                          if (data?.url) {
                            setMediaUrl(data.url);
                            setValue("mediaUrl", data.url);
                            setMediaUpload(false);
                            setMediaUploadSuccess(true);
                          }
                          // updateProfileMutation.mutate(res);
                        }}
                        onUploadError={(error: Error) => {
                          // Do something with the error.
                          alert(`ERROR! ${error.message}`);
                        }}
                      />

                      <div className="flex items-center justify-center py-2">
                        <PlayableMedia
                          mediaType={mediaType}
                          mediaUrl={mediaUrl}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <>
                  <div className="rounded-md bg-base-200 p-2">
                    <label className="label  font-bold">NFT Info</label>

                    <>
                      <div className="w-full max-w-xs ">
                        <label className="label">
                          <span className="label-text">
                            Asset Name<span className="text-red-600">*</span>
                          </span>
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
                          <span className="label-text">
                            Limit<span className="text-red-600">*</span>
                          </span>
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
                            <span className="label-text-alt text-warning">
                              {errors.limit.message}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className=" w-full max-w-xs ">
                        <label className="label">
                          <span className="label-text">
                            Price in $USD<span className="text-red-600">*</span>
                          </span>
                        </label>
                        <input
                          // disabled={trxdata?.successful ? true : false}
                          type="number"
                          {...register("priceUSD", { valueAsNumber: true })}
                          className="input input-sm input-bordered  w-full"
                          placeholder="Enter Price in USD"
                        />
                        {errors.priceUSD && (
                          <div className="label">
                            <span className="label-text-alt text-warning">
                              {errors.priceUSD.message}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className=" w-full max-w-xs ">
                        <label className="label">
                          <span className="label-text">
                            Price in {PLATFORM_ASSET.code}
                            <span className="text-red-600">*</span>
                          </span>
                        </label>
                        <input
                          // disabled={trxdata?.successful ? true : false}
                          type="number"
                          {...register("price", { valueAsNumber: true })}
                          className="input input-sm input-bordered  w-full"
                          placeholder={`Price in ${PLATFORM_ASSET.code}`}
                        />
                        {errors.price && (
                          <div className="label">
                            <span className="label-text-alt text-warning">
                              {errors.price.message}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
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
                {requiredTokenAmount > platformAssetBalance && <RechargeLink />}
              </div>
              <PaymentChoose
                costBreakdown={[
                  {
                    label: "Cost",
                    amount: paymentMethod === "asset" ? requiredTokenAmount - totalFeees : 2,
                    type: "cost",
                    highlighted: true,
                  },
                  {
                    label: "Platform Fee",
                    amount: paymentMethod === "asset" ? totalFeees : 2,
                    highlighted: false,
                    type: "fee",
                  },
                  {
                    label: "Total Cost",
                    amount: paymentMethod === "asset" ? requiredTokenAmount : 2 + 2,
                    highlighted: false,
                    type: "total",
                  },
                ]}
                XLM_EQUIVALENT={2 + 2}
                handleConfirm={() => onSubmit()}
                loading={loading}
                requiredToken={requiredTokenAmount}
                trigger={
                  <Button
                    disabled={
                      loading ||
                      requiredTokenAmount > platformAssetBalance ||
                      !isValid
                    }
                  >
                    {loading && (
                      <span className="loading loading-spinner"></span>
                    )}
                    Create Asset
                  </Button>
                }
              />
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TiersOptions({
  tiers,
  handleTierChange,
}: {
  tiers: { id: number; name: string; price: number }[];
  handleTierChange: (value: string) => void;
}) {
  return (
    <>
      <Select onValueChange={handleTierChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select a tier" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Choose Tier</SelectLabel>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Only Followers</SelectItem>
            {tiers.map((model) => (
              <SelectItem
                key={model.id}
                value={model.id.toString()}
              >{`${model.name} - ${model.price}`}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
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

interface VisibilityToggleProps {
  isVisible: boolean;
  toggleVisibility: () => void;
}

export function VisibilityToggle({
  isVisible,
  toggleVisibility,
}: VisibilityToggleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleVisibility}
            aria-label={isVisible ? "Set to private" : "Set to visible"}
          >
            {isVisible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isVisible ? "Visible to all" : "Private"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
