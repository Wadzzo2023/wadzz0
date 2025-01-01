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
import * as React from "react";

import { Button } from "../shadcn/ui/button";
import Alert from "../ui/alert";
import Loading from "../wallete/loading";
import RechargeLink from "./recharge/link";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/shadcn/ui/select";

import { Eye, EyeOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { ipfsHashToUrl } from "~/utils/ipfs";
import { UploadS3Button } from "~/pages/test";

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

  // if (requiredToken.isLoading) return <Loading />;

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
      setParentIsOpen(false);
      setPaymentModalOpen(false);
      setIsOpen(false);
      setMediaUploadSuccess(false);
      setMediaUrl(undefined);
      setCover(undefined);
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
      case MediaType.THREE_D:
        return "modelUploader";
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
        className="max-h-[90vh] min-h-[90vh] w-[90vw] max-w-xl overflow-auto p-3 sm:h-auto sm:w-full"
      >
        <DialogHeader className="text-lg font-bold">Add Store Item</DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-lg bg-base-200 p-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between w-full">
              <div className="w-full sm:w-auto">
                <ul className="w-full rounded-box bg-base-300 p-1 flex gap-1  justify-center">
                  {Object.values(MediaType).map((media, i) => (
                    <li key={i} className={clsx(
                      " text-sm w-full ",
                      media === mediaType ? "bg-primary text-primary-foreground rounded-lg" : ""
                    )}>
                      <Button
                        type="button"
                        variant={media === mediaType ? "default" : "outline"}
                        onClick={() => handleMediaChange(media)}
                        className="w-full"
                      >
                        {media === MediaType.THREE_D ? "3D" : media}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
              {!isAdmin && tiers.data && (
                <TiersOptions
                  handleTierChange={(value: string) => {
                    setTier(value);
                  }}
                  tiers={tiers.data}
                />
              )}
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="label font-bold">Media Info</label>
                <input
                  minLength={2}
                  required
                  {...register("name")}
                  className="input input-sm input-bordered w-full"
                  placeholder="Enter NFT Name"
                />
                {errors.name && (
                  <p className="text-warning text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <input
                  {...register("description")}
                  className="input input-sm input-bordered w-full"
                  placeholder="Write a short Description"
                />
                {errors.description && (
                  <p className="text-warning text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  Choose a thumbnail Max 1MB (this will be used as NFT Image)
                </label>
                <input
                  type="file"
                  accept=".jpg, .png, .jpeg"
                  onChange={handleChange}
                  className="file-input file-input-bordered file-input-sm w-full"
                />
                {coverUrl && (
                  <Image
                    className="mt-2"
                    width={100}
                    height={100}
                    alt="preview image"
                    src={coverUrl}
                  />
                )}
              </div>

              <div>
                <label className="label">Choose your media</label>
                <UploadS3Button
                  endpoint={getEndpoint(mediaType)}
                  onClientUploadComplete={(res) => {
                    const data = res;
                    if (data?.url) {
                      setMediaUrl(data.url);
                      setValue("mediaUrl", data.url);
                      setMediaUpload(false);
                      setMediaUploadSuccess(true);
                    }
                  }}
                  onUploadError={(error: Error) => {
                    // Do something with the error.
                    toast.error(`ERROR! ${error.message}`);
                  }}
                />



                {mediaType === 'THREE_D' && <p className="text-sm mt-1 text-red-400">[only .obj accepted]</p>}
                {mediaUrl && (
                  <PlayableMedia mediaType={mediaType} mediaUrl={mediaUrl} />
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-base-200 p-2 space-y-4">
            <label className="label font-bold">NFT Info</label>
            <input
              {...register("code")}
              className={clsx(
                "input input-sm input-bordered w-full",
                errors.code && "input-warning"
              )}
              placeholder="Enter Asset Name"
            />
            {errors.code && (
              <p className="text-warning text-sm">{errors.code.message}</p>
            )}

            <div className=" w-full ">
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
            <div className=" w-full  ">
              <span className="label-text">
                Price in $USD<span className="text-red-600">*</span>
              </span>
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
            <div className=" w-full ">
              <span className="label-text">
                Price in {PLATFORM_ASSET.code}
                <span className="text-red-600">*</span>
              </span>
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
          </div>

          <Alert
            type={requiredTokenAmount > platformAssetBalance ? "warning" : "normal"}
            content={`You need minimum ${requiredTokenAmount} ${PLATFORM_ASSET.code}`}
          />
          {requiredTokenAmount > platformAssetBalance && <RechargeLink />}

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
                amount: paymentMethod === "asset" ? requiredTokenAmount : 4,
                highlighted: false,
                type: "total",
              },
            ]}
            XLM_EQUIVALENT={4}
            handleConfirm={() => onSubmit()}
            loading={loading}
            requiredToken={requiredTokenAmount}
            trigger={
              <Button
                disabled={loading || requiredTokenAmount > platformAssetBalance || !isValid}
                className="w-full"
              >
                {loading && <span className="loading loading-spinner mr-2"></span>}
                Create Asset
              </Button>
            }
          />
        </form>
      </DialogContent>
    </Dialog>
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
      case MediaType.THREE_D:
        return (
          <div className="text-center">
            <span className="text-center text-green-600">Obj has uploaded!!</span>
          </div>
        )

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
