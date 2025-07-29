import { zodResolver } from "@hookform/resolvers/zod";
import { MediaType } from "@prisma/client";
import clsx from "clsx";
import { Box, ChevronDown, ChevronUp, DollarSign, Package, Plus, PlusIcon, QrCode, X } from "lucide-react";
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
import { useCreatorStorageAcc, useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { PLATFORM_ASSET, PLATFORM_FEE, TrxBaseFeeInPlatformAsset } from "~/lib/stellar/constant";
import { AccountSchema, clientSelect } from "~/lib/stellar/fan/utils";
import { api } from "~/utils/api";
import { BADWORDS } from "~/utils/banned-word";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/shadcn/ui/collapsible"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/shadcn/ui/card"

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
import { Label } from "../shadcn/ui/label";
import { Input } from "../shadcn/ui/input";
import { DialogTitle } from "../ui/dialog";
import { Textarea } from "../shadcn/ui/textarea";
import { QRItem } from "~/types/qr";

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
  //code can't contain any spaces
  code: z
    .string()
    .min(4, { message: "Must be a minimum of 4 characters" })
    .max(12, { message: "Must be a maximum of 12 characters" }).
    regex(/^[a-zA-Z]*$/, { message: "Asset Name can only contain letters" }),
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
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState<"store-item" | "sell-asset" | "qr-item" | null>(null)

  const handleOptionSelect = (option: "store-item" | "sell-asset" | "qr-item") => {
    setSelectedOption(option)
  }

  const handleBack = () => {
    setSelectedOption(null)
  }

  const handleClose = () => {
    setIsOpen(false)
    setSelectedOption(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <PlusIcon size={16} /> Item
        </Button>
      </DialogTrigger>
      <DialogContent className=" w-[90vw] max-w-xl p-3">
        {!selectedOption ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Choose Action</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col gap-2 bg-transparent"
                onClick={() => handleOptionSelect("store-item")}
              >
                <Package className="h-6 w-6" />
                <span>Create Store Item</span>
                <span className="text-xs text-muted-foreground">Create NFT assets for your store</span>
              </Button>

              <Button
                variant="outline"
                className="w-full h-20 flex flex-col gap-2 bg-transparent"
                onClick={() => handleOptionSelect("sell-asset")}
              >
                <DollarSign className="h-6 w-6" />
                <span>Sell Page Asset</span>
                <span className="text-xs text-muted-foreground">List assets for sale on marketplace</span>
              </Button>
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col gap-2 bg-transparent"
                onClick={() => handleOptionSelect("qr-item")}
              >
                <QrCode className="h-6 w-6" />
                <span>Create QR Item</span>
                <span className="text-xs text-muted-foreground">Create QR code items for events</span>
              </Button>
            </div>
          </>
        ) : selectedOption === "store-item" ? (
          <NftCreateDialog isAdmin={isAdmin} onBack={handleBack} onClose={handleClose} requiredTokenAmount={requiredTokenAmount} />
        ) : selectedOption === "sell-asset" ? (
          <SellPageAssetDialog isAdmin={isAdmin} onBack={handleBack} onClose={handleClose} />
        ) : selectedOption === "qr-item" ? (
          <QrCodeDialog isAdmin={isAdmin} onBack={handleBack} onClose={handleClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

const NftCreateDialog = ({
  isAdmin,
  onBack,
  onClose,
  requiredTokenAmount
}: {
  isAdmin?: true;
  onBack: () => void;
  onClose: () => void;
  requiredTokenAmount: number;
}) => {
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
    if (ipfs) {
      xdrMutation.mutate({
        code: getValues("code"),
        limit: getValues("limit"),
        signWith: needSign(isAdmin),
        ipfsHash: ipfs,
        native: paymentMethod === "xlm",
      });
    }
    else {
      toast.error("Please upload a thumbnail image.")
    }

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
    <div className="max-h-[90vh] min-h-[90vh]  sm:h-auto sm:w-full overflow-auto p-0">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <h2 className="text-lg font-bold">Add Store Item</h2>
      </div>

      <div className="p-4 border rounded-lg">
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

              <div className="space-y-4">
                <Label htmlFor="coverImg">Cover Image</Label>
                <div className="flex flex-col items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => document.getElementById('coverImg')?.click()}
                    className="w-full "
                  >
                    Choose Cover Image
                  </Button>
                  <Input
                    id="coverImg"
                    type="file"
                    accept=".jpg, .png"
                    onChange={handleChange}
                    className="hidden"
                  />
                  {uploading && <progress className="progress w-56"></progress>}
                </div>
                {coverUrl && (
                  <div className="mt-4 ">
                    <Image
                      width={120}
                      height={120}
                      alt="preview image"
                      src={coverUrl}
                      className="rounded"
                    />
                  </div>
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
              {
                errors.mediaUrl && (
                  <p className="text-warning text-sm mt-1">{errors.mediaUrl.message}</p>
                )
              }
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
            handleConfirm={handleSubmit(onSubmit)}
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
      </div>
    </div>
  )
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

function SellPageAssetDialog({
  isAdmin,
  onBack,
  onClose,
}: {
  isAdmin?: true
  onBack: () => void
  onClose: () => void
}) {
  return (
    <div className="max-h-[80vh] overflow-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <h2 className="text-lg font-bold">Sell Page Asset</h2>
      </div>
      <SellPageAssetCreate isAdmin={isAdmin} onClose={onClose} />
    </div>
  )
}
interface SellPageAssetCreateProps {
  isAdmin?: boolean
  onClose: () => void
}

// Remove the pageAsset reference from the schema
export const SellPageAssetSchema = z.object({
  title: z
    .string()
    .refine(
      (value) => {
        return !BADWORDS.some((word) => value.toLowerCase().includes(word.toLowerCase()))
      },
      {
        message: "Title contains banned words.",
      },
    ).optional(),
  description: z.string().optional(),
  amountToSell: z
    .number({
      required_error: "Amount to sell must be entered as a number",
      invalid_type_error: "Amount to sell must be entered as a number",
    })
    .int({ message: "Amount must be a whole number" })
    .positive({ message: "Amount must be greater than 0" }),
  price: z
    .number({
      required_error: "Price must be entered as a number",
      invalid_type_error: "Price must be entered as a number",
    })
    .positive({ message: "Price must be greater than 0" }),
  priceUSD: z
    .number({
      required_error: "USD price must be entered as a number",
      invalid_type_error: "USD price must be entered as a number",
    })
    .positive({ message: "USD price must be greater than 0" })
    .default(1),
  priceXLM: z
    .number({
      required_error: "XLM price must be entered as a number",
      invalid_type_error: "XLM price must be entered as a number",
    })
    .nonnegative({ message: "XLM price cannot be negative" })
    .default(0),
})

type SellPageAssetFormData = z.infer<typeof SellPageAssetSchema>

export function SellPageAssetCreate({ isAdmin, onClose }: SellPageAssetCreateProps) {
  const session = useSession()
  const [submitLoading, setSubmitLoading] = useState(false)
  const [pageAsset, setPageAsset] = useState<string | null>(null)


  // Add this function inside the component after pageAsset state is declared
  const validateAmountToSell = (value: number) => {
    const availableBalance = pageAsset ? Number.parseInt(pageAsset) : 0
    if (value > availableBalance) {
      return "Amount exceeds available balance"
    }
    return true
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<SellPageAssetFormData>({
    resolver: zodResolver(SellPageAssetSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      priceUSD: 1,
      priceXLM: 0,
    },
  })

  const pageAssetBalance = api.wallate.acc.getCreatorPageAssetBallances.useQuery(undefined, {
    onSuccess: (data) => {
      if (data) {
        setPageAsset(data.balance)
      }
    },
    onError: (error) => {
      console.log(error)
    },
    refetchOnWindowFocus: false,
  })

  const watchedAmountToSell = watch("amountToSell")
  const watchedPrice = watch("price")
  const watchedPriceUSD = watch("priceUSD")

  const createSellPageAsset = api.fan.asset.sellPageAsset.useMutation({
    onSuccess: () => {
      toast.success("Sell Page Asset Created Successfully", {
        position: "top-center",
        duration: 4000,
      })
      reset()
      onClose()
    },
    onError: (error) => {
      toast.error(`Failed to create asset: ${error.message}`)
    },
    onSettled: () => {
      setSubmitLoading(false)
    },
  })

  const calculateRemaining = () => {
    const availableBalance = pageAsset ? Number.parseInt(pageAsset) : 0
    const amountToSell = watchedAmountToSell ?? 0
    return Math.max(0, availableBalance - amountToSell)
  }

  const availableBalance = pageAsset ? Number.parseInt(pageAsset) : 0

  const onSubmit = (data: SellPageAssetFormData) => {
    if (!session.data?.user?.id) {
      toast.error("You must be logged in to create an asset")
      return
    }

    setSubmitLoading(true)

    // Use the pageAssetBalance code as title if it exists
    const assetCode = `${data.amountToSell} ${pageAssetBalance.data?.code}` || "Unknown Asset";

    // Create a modified data object with the title set to the asset code
    const modifiedData = {
      ...data,
      title: assetCode
    };

    createSellPageAsset.mutate(modifiedData);
  }

  const handlePriceChange = (value: number) => {
    setValue("price", value)
    const usdValue = value * 0.5
    setValue("priceUSD", Number(usdValue.toFixed(2)))
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {pageAssetBalance.isLoading && (
          <div className="rounded-lg bg-base-200 p-4 text-center">
            <span className="loading loading-spinner mr-2"></span>
            Loading your asset balance...
          </div>
        )}

        {pageAssetBalance.isError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center text-red-600">
            Failed to load asset balance. Please refresh and try again.
          </div>
        )}

        {availableBalance === 0 && !pageAssetBalance.isLoading && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-center text-yellow-700">
            You don{"'"}t have any page assets available to sell.
          </div>
        )}
        {/* Asset Information Section */}
        <div className="rounded-lg bg-base-200 p-4 space-y-4">
          <Label className="text-base font-bold">Sell Information</Label>

          {/* <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-600">*</span>
            </Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Enter asset title"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
          </div> */}

          <div className="space-y-2">
            <Label htmlFor="description">Description </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter asset description (optional)"
              rows={3}
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountToSell">
              Amount to Sell {pageAssetBalance.data?.code} <span className="text-red-600">*</span>
            </Label>
            <div className="relative">
              <Input
                id="amountToSell"
                type="number"
                min="1"
                max={availableBalance}
                step="1"
                {...register("amountToSell", {
                  valueAsNumber: true,
                  validate: validateAmountToSell,
                })}
                placeholder="Enter quantity to sell"
                className={errors.amountToSell ? "border-red-500" : ""}
              />
              {pageAssetBalance.isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="loading loading-spinner loading-xs"></span>
                </div>
              )}
            </div>

            {/* Balance Information */}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                Available: <span className="font-medium text-foreground">{availableBalance}</span>
              </span>
              {watchedAmountToSell > 0 && (
                <span className="text-muted-foreground">
                  Remaining:{" "}
                  <span className={`font-medium ${calculateRemaining() === 0 ? "text-orange-500" : "text-green-600"}`}>
                    {calculateRemaining()}
                  </span>
                </span>
              )}
            </div>

            {errors.amountToSell && <p className="text-red-500 text-sm">{errors.amountToSell.message}</p>}

            {/* Quick select buttons */}
            {availableBalance > 0 && (
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue("amountToSell", Math.floor(availableBalance * 0.25))}
                  className="text-xs"
                >
                  25%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue("amountToSell", Math.floor(availableBalance * 0.5))}
                  className="text-xs"
                >
                  50%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue("amountToSell", Math.floor(availableBalance * 0.75))}
                  className="text-xs"
                >
                  75%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue("amountToSell", availableBalance)}
                  className="text-xs"
                >
                  Max
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">How many units of this asset do you want to sell?</p>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="rounded-lg bg-base-200 p-4 space-y-4">
          <Label className="text-base font-bold">Pricing Information</Label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                {PLATFORM_ASSET.code} Price <span className="text-red-600">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price", {
                  valueAsNumber: true,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => handlePriceChange(Number(e.target.value)),
                })}
                placeholder="0.00"
                className={errors.price ? "border-red-500" : ""}
              />
              {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="priceUSD">
                Price in USD <span className="text-red-600">*</span>
              </Label>
              <Input
                id="priceUSD"
                type="number"
                step="0.01"
                {...register("priceUSD", { valueAsNumber: true })}
                placeholder="1.00"
                className={errors.priceUSD ? "border-red-500" : ""}
              />
              {errors.priceUSD && <p className="text-red-500 text-sm">{errors.priceUSD.message}</p>}
            </div> */}

            <div className="space-y-2">
              <Label htmlFor="priceXLM">Price in XLM</Label>
              <Input
                id="priceXLM"
                type="number"
                step="0.0000001"
                {...register("priceXLM", { valueAsNumber: true })}
                placeholder="0.00"
                className={errors.priceXLM ? "border-red-500" : ""}
              />
              {errors.priceXLM && <p className="text-red-500 text-sm">{errors.priceXLM.message}</p>}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>• Platform Price: Main pricing in your platform currency</p>
            {/* <p>• USD Price: Equivalent price in US Dollars</p> */}
            <p>• XLM Price: Optional price in Stellar Lumens (0 = not available in XLM)</p>
          </div>
        </div>
        {watchedPrice > 0 && (
          <div className="rounded-lg bg-base-100 p-4 border">
            <Label className="text-base font-bold mb-2 block">Preview</Label>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p>
                    <strong>Available Balance:</strong> {availableBalance} units
                  </p>
                  <p>
                    <strong>Amount to Sell:</strong> {watchedAmountToSell ?? 0} units
                  </p>
                  <p className={`${calculateRemaining() === 0 ? "text-orange-500" : "text-green-600"}`}>
                    <strong>Remaining After Sale:</strong> {calculateRemaining()} units
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Price per Unit:</strong> {watchedPrice ?? 0}
                  </p>
                  {/* <p>
                  <strong>USD Price per Unit:</strong> ${watchedPriceUSD || 0}
                </p> */}
                  <p>
                    <strong>XLM Price per Unit:</strong> {watch("priceXLM") ?? 0} XLM
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}
        {/* Submit Section */}
        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-transparent"
            disabled={submitLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!isValid || submitLoading} className="flex-1">
            {submitLoading && <span className="loading loading-spinner mr-2"></span>}
            Create Sell Page Asset
          </Button>
        </div>
      </form>

      {/* Preview Section */}

    </div>
  )
}

function QrCodeDialog({
  isAdmin,
  onBack,
  onClose,
}: {
  isAdmin?: true
  onBack: () => void
  onClose: () => void
}) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-auto">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back
          </Button>
          <h2 className="text-lg font-bold">Create QR Code Item</h2>
        </div>


        <QrCodeCreate isAdmin={isAdmin} onClose={onClose} />

      </DialogContent>
    </Dialog>
  )
}
interface DescriptionField {
  id: string
  content: string
  isCollapsed: boolean,
}
interface DescriptionField {
  id: string
  title: string
  content: string
  isCollapsed: boolean
  order: number
}

const QrCodeCreate = ({
  isAdmin,
  onClose,
}: {
  isAdmin?: boolean
  onClose: () => void
}) => {
  const { data: session } = useSession()
  const [progress, setProgress] = useState(0)

  const [formData, setFormData] = useState({
    title: "",
    modelUrl: "",
    externalLink: "",
    startDate: "",
    endDate: "",
  })

  const [descriptions, setDescriptions] = useState<DescriptionField[]>([
    { id: "temp-1", title: "", content: "", isCollapsed: false, order: 1 },
  ])

  const [errors, setErrors] = useState<{
    title?: string
    descriptions?: Record<string, { title?: string; content?: string }>
    modelUrl?: string
    startDate?: string
    endDate?: string
  }>({})

  const createQRItem = api.qr.createQRItem.useMutation({
    onSuccess: () => {
      toast.success("QR item created successfully!")
      resetForm()
      onClose()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const resetForm = () => {
    setFormData({
      title: "",
      modelUrl: "",
      externalLink: "",
      startDate: "",
      endDate: "",
    })
    setDescriptions([{ id: "temp-1", title: "", content: "", isCollapsed: false, order: 1 }])
    setErrors({})
  }

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    // Validate main title
    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    } else if (formData.title.length > 100) {
      newErrors.title = "Title must be 100 characters or less"
    }

    // Validate descriptions
    const descriptionErrors: Record<string, { title?: string; content?: string }> = {}
    let hasValidDescription = false

    descriptions.forEach((desc) => {
      const descError: { title?: string; content?: string } = {}

      // Validate description title
      if (!desc.title.trim()) {
        descError.title = "Description title is required"
      } else if (desc.title.length > 50) {
        descError.title = "Description title must be 50 characters or less"
      }

      // Validate description content - UPDATED TO USE CHARACTER LIMIT
      if (!desc.content.trim()) {
        descError.content = "Description content cannot be empty"
      } else {
        const charCount = desc.content.length
        if (charCount > 600) {
          descError.content = `Description must be 600 characters or less (current: ${charCount} characters)`
        } else if (desc.title.trim()) {
          hasValidDescription = true
        }
      }

      if (descError.title ?? descError.content) {
        descriptionErrors[desc.id] = descError
      }
    })

    if (!hasValidDescription) {
      newErrors.descriptions = descriptionErrors
    } else if (Object.keys(descriptionErrors).length > 0) {
      newErrors.descriptions = descriptionErrors
    }

    // Validate model URL
    if (!formData.modelUrl) {
      newErrors.modelUrl = "3D Model is required"
    }

    // Validate dates
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required"
    }
    if (!formData.endDate) {
      newErrors.endDate = "End date is required"
    }
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = "End date must be after start date"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    // Prepare descriptions data for the new schema
    const validDescriptions = descriptions
      .filter((desc) => desc.title.trim() && desc.content.trim())
      .sort((a, b) => a.order - b.order)
      .map((desc) => ({
        title: desc.title.trim(),
        content: desc.content.trim(),
        order: desc.order,
      }))

    createQRItem.mutate({
      title: formData.title,
      descriptions: validDescriptions,
      modelUrl: formData.modelUrl,
      externalLink: formData.externalLink || undefined,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
    })
  }

  const handleModelUpload = () => {
    const hiddenInput = document.getElementById("qr-model-upload") as HTMLInputElement
    if (hiddenInput) {
      hiddenInput.click()
    }
  }

  const addDescription = () => {
    if (descriptions.length >= 4) {
      toast.error("Maximum 4 descriptions allowed")
      return
    }

    // Collapse all existing descriptions
    const updatedDescriptions = descriptions.map((desc) => ({
      ...desc,
      isCollapsed: true,
    }))

    // Find the next order number
    const nextOrder = Math.max(...descriptions.map((d) => d.order)) + 1

    // Add new description
    const newDescription: DescriptionField = {
      id: `temp-${Date.now()}`,
      title: "",
      content: "",
      isCollapsed: false,
      order: nextOrder,
    }

    setDescriptions([...updatedDescriptions, newDescription])
  }

  const removeDescription = (id: string) => {
    if (descriptions.length <= 1) {
      toast.error("At least one description is required")
      return
    }

    const remainingDescriptions = descriptions.filter((desc) => desc.id !== id)

    // Reorder remaining descriptions to fill gaps
    const reorderedDescriptions = remainingDescriptions
      .sort((a, b) => a.order - b.order)
      .map((desc, index) => ({
        ...desc,
        order: index + 1,
      }))

    setDescriptions(reorderedDescriptions)

    // Clear errors for removed description
    if (errors.descriptions) {
      const newDescriptionErrors = { ...errors.descriptions }
      delete newDescriptionErrors[id]
      setErrors({
        ...errors,
        descriptions: Object.keys(newDescriptionErrors).length > 0 ? newDescriptionErrors : undefined,
      })
    }
  }

  const updateDescription = (id: string, field: "title" | "content", value: string) => {
    setDescriptions(descriptions.map((desc) => (desc.id === id ? { ...desc, [field]: value } : desc)))

    // Clear error for this description field if it's now valid
    if (errors.descriptions?.[id]?.[field]) {
      const newDescriptionErrors = { ...errors.descriptions }
      if (field === "title" && value.trim() && value.length <= 50) {
        delete newDescriptionErrors[id]?.title
      } else if (field === "content" && value.trim() && value.length <= 600) {
        // UPDATED TO USE CHARACTER LIMIT
        delete newDescriptionErrors[id]?.content
      }

      // Clean up empty error objects
      if (newDescriptionErrors[id] && !newDescriptionErrors[id]?.title && !newDescriptionErrors[id]?.content) {
        delete newDescriptionErrors[id]
      }

      setErrors({
        ...errors,
        descriptions: Object.keys(newDescriptionErrors).length > 0 ? newDescriptionErrors : undefined,
      })
    }
  }

  const toggleDescriptionCollapse = (id: string) => {
    setDescriptions(descriptions.map((desc) => (desc.id === id ? { ...desc, isCollapsed: !desc.isCollapsed } : desc)))
  }

  const getDescriptionDisplayTitle = (desc: DescriptionField): string => {
    if (desc.title.trim()) {
      return desc.title.trim()
    }
    return `Description ${desc.order}`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Main Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Main Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, title: e.target.value }))
            if (errors.title) {
              setErrors({ ...errors, title: undefined })
            }
          }}
          placeholder="Enter main item title"
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
      </div>

      {/* Descriptions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Descriptions * (Max 4, 600 characters each)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDescription}
            disabled={descriptions.length >= 4}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Description
          </Button>
        </div>

        <div className="space-y-3">
          {descriptions
            .sort((a, b) => a.order - b.order)
            .map((desc) => (
              <Card key={desc.id} className={errors.descriptions?.[desc.id] ? "border-red-500" : ""}>
                <Collapsible open={!desc.isCollapsed} onOpenChange={() => toggleDescriptionCollapse(desc.id)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        <span className="text-muted-foreground">#{desc.order}</span> {getDescriptionDisplayTitle(desc)}
                        {desc.content.trim() && (
                          <span className="ml-2 text-xs text-muted-foreground">({desc.content.length} chars)</span>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {desc.isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        {descriptions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDescription(desc.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      {/* Description Title */}
                      <div className="space-y-2">
                        <Label htmlFor={`desc-title-${desc.id}`}>Description Title *</Label>
                        <Input
                          id={`desc-title-${desc.id}`}
                          value={desc.title}
                          onChange={(e) => updateDescription(desc.id, "title", e.target.value)}
                          placeholder={`Enter title for description ${desc.order}`}
                          className={errors.descriptions?.[desc.id]?.title ? "border-red-500" : ""}
                        />
                        {errors.descriptions?.[desc.id]?.title && (
                          <p className="text-sm text-red-500">{errors.descriptions[desc.id]?.title}</p>
                        )}
                        <div className="text-xs text-muted-foreground">Characters: {desc.title.length}/50</div>
                      </div>

                      {/* Description Content */}
                      <div className="space-y-2">
                        <Label htmlFor={`desc-content-${desc.id}`}>Description Content *</Label>
                        <Textarea
                          id={`desc-content-${desc.id}`}
                          value={desc.content}
                          onChange={(e) => updateDescription(desc.id, "content", e.target.value)}
                          placeholder={`Enter content for ${desc.title || `description ${desc.order}`}...`}
                          rows={4}
                          className={errors.descriptions?.[desc.id]?.content ? "border-red-500" : ""}
                          maxLength={600} // Add HTML maxLength attribute for additional UX
                        />
                        {errors.descriptions?.[desc.id]?.content && (
                          <p className="text-sm text-red-500">{errors.descriptions[desc.id]?.content}</p>
                        )}
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span className={desc.content.length > 600 ? "text-red-500 font-medium" : ""}>
                            Characters: {desc.content.length}/600
                          </span>
                          <span>
                            {desc.content.length > 600 && (
                              <span className="text-red-500">Exceeds limit by {desc.content.length - 600}</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
        </div>
      </div>

      {/* 3D Model Upload */}
      <div className="space-y-2">
        <Label>3D Model * (GLB)</Label>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleModelUpload}
            className={`gap-2 bg-transparent ${errors.modelUrl ? "border-red-500" : ""}`}
          >
            <Box className="h-4 w-4" />
            {formData.modelUrl ? "Change Model" : "Upload 3D Model"}
          </Button>
          {formData.modelUrl && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Box className="h-4 w-4" />
              Model uploaded successfully
            </div>
          )}

        </div>
        <UploadS3Button
          id="qr-model-upload"
          variant="hidden"
          endpoint="modelUploader"
          onBeforeUploadBegin={(file) => {
            if (!file.name.endsWith(".glb")) {
              toast.error("Invalid file type. Please upload a .glb file.")
              return undefined
            }
            return file
          }}
          onClientUploadComplete={(file) => {
            if (!file) {
              toast.error("No file uploaded")
              return
            }
            setFormData((prev) => ({ ...prev, modelUrl: file.url }))
            toast.success("3D Model uploaded successfully!")
          }}
        />
        {errors.modelUrl && <p className="text-sm text-red-500">{errors.modelUrl}</p>}
      </div>

      {/* External Link */}
      <div className="space-y-2">
        <Label htmlFor="externalLink">External Link (Optional)</Label>
        <Input
          id="externalLink"
          type="url"
          value={formData.externalLink}
          onChange={(e) => setFormData((prev) => ({ ...prev, externalLink: e.target.value }))}
          placeholder="https://example.com"
        />
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, startDate: e.target.value }))
              if (errors.startDate) {
                setErrors({ ...errors, startDate: undefined })
              }
            }}
            className={errors.startDate ? "border-red-500" : ""}
          />
          {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date *</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, endDate: e.target.value }))
              if (errors.endDate) {
                setErrors({ ...errors, endDate: undefined })
              }
            }}
            className={errors.endDate ? "border-red-500" : ""}
          />
          {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createQRItem.isLoading}>
          {createQRItem.isLoading ? "Creating..." : "Create QR Item"}
        </Button>
      </div>
    </form>
  )
}

