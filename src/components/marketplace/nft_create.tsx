import { zodResolver } from "@hookform/resolvers/zod";
import { MediaType } from "@prisma/client";
import clsx from "clsx";
import { Box, ChevronDown, ChevronUp, DollarSign, Package, Plus, PlusIcon, QrCode, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { clientsign } from "package/connect_wallet";
import { WalletType } from "package/connect_wallet/src/lib/enums";
import { ChangeEvent, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
  code: z
    .string()
    .min(4, { message: "Must be a minimum of 4 characters" })
    .max(12, { message: "Must be a maximum of 12 characters" })
    .regex(/^[a-zA-Z]*$/, { message: "Asset Name can only contain letters" }),
  issuer: AccountSchema.optional(),
  songInfo: ExtraSongInfo.optional(),
  isAdmin: z.boolean().optional(),
  tier: z.string().optional(),
});

export default function NftCreate({ admin: isAdmin }: { admin?: true }) {
  const requiredToken = api.fan.trx.getRequiredPlatformAsset.useQuery({
    xlm: 2,
  });

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

  const actionOptions = [
    {
      key: "store-item" as const,
      icon: <Package className="h-6 w-6" />,
      label: "Create Store Item",
      description: "Create NFT assets for your store",
    },
    {
      key: "sell-asset" as const,
      icon: <DollarSign className="h-6 w-6" />,
      label: "Sell Page Asset",
      description: "List assets for sale on marketplace",
    },
    {
      key: "qr-item" as const,
      icon: <QrCode className="h-6 w-6" />,
      label: "Create QR Item",
      description: "Create QR code items for events",
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <PlusIcon size={16} className="mr-1" /> Item
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-2xl p-0 overflow-hidden">
        {!selectedOption ? (
          <div className="flex flex-col">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle className="text-xl font-bold">Choose Action</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Select what you&apos;d like to create</p>
            </DialogHeader>

            {/* 2-column grid on sm+, single column on mobile */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {actionOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleOptionSelect(opt.key)}
                  className={clsx(
                    "group relative flex flex-col items-start gap-3 rounded-xl border p-5",
                    "bg-card hover:bg-accent/50 text-left",
                    "transition-all duration-200 hover:shadow-md hover:border-primary/40",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                      {opt.icon}
                    </span>
                    <span className="font-semibold text-sm">{opt.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-0">
                    {opt.description}
                  </p>
                </button>
              ))}

              {/* The 3rd card spans full width on sm screens so it doesn't look orphaned */}
              {/* Already handled naturally since grid is 2-col and we have 3 items */}
            </div>
          </div>
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
  const [file, setFile] = useState<File>();
  const [ipfs, setCid] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [mediaUpload, setMediaUpload] = useState(false);
  const inputFile = useRef(null);
  const [tier, setTier] = useState<string>();
  const modalRef = useRef<HTMLDialogElement>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [mediaUploadSuccess, setMediaUploadSuccess] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>(MediaType.IMAGE);
  const [mediaUrl, setMediaUrl] = useState<string>();
  const [coverUrl, setCover] = useState<string>();
  const { needSign } = useNeedSign();

  const connectedWalletType = session.data?.user.walletType ?? WalletType.none;
  const walletType = isAdmin ? WalletType.isAdmin : connectedWalletType;

  const totalFeees = Number(TrxBaseFeeInPlatformAsset) + Number(PLATFORM_FEE);
  const { paymentMethod, setIsOpen: setPaymentModalOpen } = usePaymentMethodStore();

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

  const tiers = api.fan.member.getAllMembership.useQuery({});

  const addAsset = api.fan.asset.createAsset.useMutation({
    onSuccess: () => {
      toast.success("NFT Created", { position: "top-center", duration: 4000 });
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
    onSuccess(data) {
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
              setValue("tier", tier);
              const data = getValues();
              addAsset.mutate({ ...data });
            } else {
              toast.error("Transaction Failed");
            }
          })
          .catch((e) => console.log(e))
          .finally(() => setSubmitLoading(false)),
        { loading: "Signing Transaction", success: "", error: "Signing Transaction Failed" },
      );
    },
  });

  const onSubmit = () => {
    if (ipfs) {
      xdrMutation.mutate({
        code: getValues("code"),
        limit: getValues("limit"),
        signWith: needSign(isAdmin),
        ipfsHash: ipfs,
        native: paymentMethod === "xlm",
      });
    } else {
      toast.error("Please upload a thumbnail image.")
    }
  };

  function getEndpoint(mediaType: MediaType) {
    switch (mediaType) {
      case MediaType.IMAGE: return "imageUploader";
      case MediaType.MUSIC: return "musicUploader";
      case MediaType.VIDEO: return "videoUploader";
      case MediaType.THREE_D: return "modelUploader";
      default: return "imageUploader";
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
      const res = await fetch("/api/file", { method: "POST", body: formData });
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
    if (files?.length) {
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
  };

  const loading = xdrMutation.isLoading || addAsset.isLoading || submitLoading;

  return (
    <div className="flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
          ← Back
        </Button>
        <h2 className="text-lg font-bold">Add Store Item</h2>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto flex-1 px-4 py-4 sm:px-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Media type tabs */}
          <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
            {Object.values(MediaType).map((media, i) => (
              <Button
                key={i}
                type="button"
                variant={media === mediaType ? "default" : "ghost"}
                size="sm"
                onClick={() => handleMediaChange(media)}
                className="flex-1 min-w-[60px] text-xs"
              >
                {media === MediaType.THREE_D ? "3D" : media}
              </Button>
            ))}
          </div>

          {/* Tier selector (non-admin only) */}
          {!isAdmin && tiers.data && (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Visibility Tier</Label>
              <TiersOptions
                handleTierChange={(value: string) => setTier(value)}
                tiers={tiers.data}
              />
            </div>
          )}

          {/* ── Media Info Card ── */}
          <div className="rounded-lg border p-4 space-y-4">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Media Info</p>

            {/* NFT Name — full width */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                NFT Name <span className="text-destructive">*</span>
              </Label>
              <input
                minLength={2}
                required
                {...register("name")}
                className="input input-sm input-bordered w-full"
                placeholder="Enter NFT Name"
              />
              {errors.name && (
                <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Description — full width */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Description</Label>
              <input
                {...register("description")}
                className="input input-sm input-bordered w-full"
                placeholder="Write a short description"
              />
            </div>

            {/* Cover image + preview side by side */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Cover Image <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('coverImg')?.click()}
                  className="bg-transparent shrink-0"
                >
                  {coverUrl ? "Change Image" : "Upload Cover"}
                </Button>
                <Input
                  id="coverImg"
                  type="file"
                  accept=".jpg, .png"
                  onChange={handleChange}
                  className="hidden"
                />
                {uploading && <progress className="progress w-32"></progress>}
                {coverUrl && (
                  <Image
                    width={48}
                    height={48}
                    alt="preview"
                    src={coverUrl}
                    className="rounded-md object-cover border"
                  />
                )}
                {!coverUrl && !uploading && (
                  <span className="text-xs text-muted-foreground">JPG or PNG, max 1MB</span>
                )}
              </div>
            </div>

            {/* Media file upload — full width */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Media File</Label>
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
                onUploadError={(error: Error) => toast.error(`ERROR! ${error.message}`)}
              />
              {mediaType === 'THREE_D' && (
                <p className="text-xs text-destructive mt-1">[only .obj accepted]</p>
              )}
              {mediaUrl && <div className="mt-2"><PlayableMedia mediaType={mediaType} mediaUrl={mediaUrl} /></div>}
              {errors.mediaUrl && (
                <p className="text-destructive text-xs mt-1">{errors.mediaUrl.message}</p>
              )}
            </div>
          </div>

          {/* ── 2-column grid for NFT Info ── */}
          <div className="rounded-lg border p-4">
            <Label className="text-base font-semibold block mb-4">NFT Info</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Asset code */}
              <div>
                <Label className="text-sm font-medium mb-1 block">
                  Asset Code <span className="text-destructive">*</span>
                </Label>
                <input
                  {...register("code")}
                  className={clsx(
                    "input input-sm input-bordered w-full",
                    errors.code && "input-warning"
                  )}
                  placeholder="e.g. MYTOKEN"
                />
                {errors.code && (
                  <p className="text-destructive text-xs mt-1">{errors.code.message}</p>
                )}
              </div>

              {/* Limit */}
              <div>
                <Label className="text-sm font-medium mb-1 block">
                  Limit <span className="text-destructive">*</span>
                </Label>
                <input
                  type="number"
                  {...register("limit", { valueAsNumber: true })}
                  className="input input-sm input-bordered w-full"
                  placeholder="Supply limit"
                />
                {errors.limit && (
                  <p className="text-destructive text-xs mt-1">{errors.limit.message}</p>
                )}
              </div>

              {/* Price USD */}
              <div>
                <Label className="text-sm font-medium mb-1 block">
                  Price in USD <span className="text-destructive">*</span>
                </Label>
                <input
                  type="number"
                  {...register("priceUSD", { valueAsNumber: true })}
                  className="input input-sm input-bordered w-full"
                  placeholder="0.00"
                />
                {errors.priceUSD && (
                  <p className="text-destructive text-xs mt-1">{errors.priceUSD.message}</p>
                )}
              </div>

              {/* Price in platform asset */}
              <div>
                <Label className="text-sm font-medium mb-1 block">
                  Price in {PLATFORM_ASSET.code} <span className="text-destructive">*</span>
                </Label>
                <input
                  type="number"
                  {...register("price", { valueAsNumber: true })}
                  className="input input-sm input-bordered w-full"
                  placeholder={`0.00 ${PLATFORM_ASSET.code}`}
                />
                {errors.price && (
                  <p className="text-destructive text-xs mt-1">{errors.price.message}</p>
                )}
              </div>
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
    <Select onValueChange={handleTierChange}>
      <SelectTrigger className="w-full sm:w-[200px]">
        <SelectValue placeholder="Select a tier" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Choose Tier</SelectLabel>
          <SelectItem value="public">Public</SelectItem>
          <SelectItem value="private">Only Followers</SelectItem>
          {tiers.map((model) => (
            <SelectItem key={model.id} value={model.id.toString()}>
              {model.name} — {model.price}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function PlayableMedia({
  mediaUrl,
  mediaType,
}: {
  mediaUrl?: string;
  mediaType: MediaType;
}) {
  if (!mediaUrl) return null;

  switch (mediaType) {
    case MediaType.IMAGE:
      return <Image alt="preview" src={mediaUrl} width={100} height={100} className="rounded" />;
    case MediaType.MUSIC:
      return <audio controls className="w-full mt-2"><source src={mediaUrl} type="audio/mpeg" /></audio>;
    case MediaType.VIDEO:
      return <video controls className="w-full mt-2 rounded"><source src={mediaUrl} type="video/mp4" /></video>;
    case MediaType.THREE_D:
      return <p className="text-sm text-green-600 mt-1">✓ 3D model uploaded</p>;
    default:
      return null;
  }
}

interface VisibilityToggleProps {
  isVisible: boolean;
  toggleVisibility: () => void;
}

export function VisibilityToggle({ isVisible, toggleVisibility }: VisibilityToggleProps) {
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
            {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
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
    <div className="flex flex-col max-h-[90vh]">
      <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
          ← Back
        </Button>
        <h2 className="text-lg font-bold">Sell Page Asset</h2>
      </div>
      <div className="overflow-y-auto flex-1 px-4 py-4 sm:px-6">
        <SellPageAssetCreate isAdmin={isAdmin} onClose={onClose} />
      </div>
    </div>
  )
}

interface SellPageAssetCreateProps {
  isAdmin?: boolean
  onClose: () => void
}

export const SellPageAssetSchema = z.object({
  title: z
    .string()
    .refine(
      (value) => {
        return !BADWORDS.some((word) => value.toLowerCase().includes(word.toLowerCase()))
      },
      { message: "Title contains banned words." },
    ).optional(),
  description: z.string().optional(),
  amountToSell: z
    .number({
      required_error: "Amount to sell must be entered as a number",
      invalid_type_error: "Amount to sell must be entered as a number",
    })
    .int({ message: "Amount must be a whole number" })
    .positive({ message: "Amount must be greater than 0" })
    .max(2_147_483_647, { message: "Amount exceeds maximum allowed value" }),
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

  // availableBalance is derived below — we read it inline here for the validators
  const getAvailable = () => (pageAsset ? Number.parseInt(pageAsset) : 0)

  /** Clamp raw input to [1, availableBalance] as a whole integer */
  const clamp = (raw: number): number => {
    const available = getAvailable()
    if (isNaN(raw) || raw < 1) return 1
    return Math.min(Math.floor(raw), available)
  }

  const setClampedAmount = (raw: number) => {
    setValue("amountToSell", clamp(raw), { shouldValidate: true, shouldDirty: true })
  }

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<SellPageAssetFormData>({
    resolver: zodResolver(SellPageAssetSchema),
    mode: "onChange",
    defaultValues: { title: "", priceUSD: 1, priceXLM: 0 },
  })

  const pageAssetBalance = api.wallate.acc.getCreatorPageAssetBallances.useQuery(undefined, {
    onSuccess: (data) => { if (data) setPageAsset(data.balance) },
    onError: (error) => console.log(error),
    refetchOnWindowFocus: false,
  })

  const watchedAmountToSell = watch("amountToSell")
  const watchedPrice = watch("price")

  const createSellPageAsset = api.fan.asset.sellPageAsset.useMutation({
    onSuccess: () => {
      toast.success("Sell Page Asset Created Successfully", { position: "top-center", duration: 4000 })
      reset()
      onClose()
    },
    onError: (error) => toast.error(`Failed to create asset: ${error.message}`),
    onSettled: () => setSubmitLoading(false),
  })

  const calculateRemaining = () => {
    const availableBalance = pageAsset ? Number.parseInt(pageAsset) : 0
    return Math.max(0, availableBalance - (watchedAmountToSell ?? 0))
  }

  const availableBalance = pageAsset ? Number.parseInt(pageAsset) : 0

  const onSubmit = (data: SellPageAssetFormData) => {
    if (!session.data?.user?.id) {
      toast.error("You must be logged in to create an asset")
      return
    }
    setSubmitLoading(true)
    const assetCode = `${data.amountToSell} ${pageAssetBalance.data?.code}` || "Unknown Asset"
    createSellPageAsset.mutate({ ...data, title: assetCode })
  }

  const handlePriceChange = (value: number) => {
    setValue("price", value)
    setValue("priceUSD", Number((value * 0.5).toFixed(2)))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {pageAssetBalance.isLoading && (
        <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
          <span className="loading loading-spinner mr-2"></span>
          Loading your asset balance...
        </div>
      )}

      {pageAssetBalance.isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center text-sm text-destructive">
          Failed to load asset balance. Please refresh and try again.
        </div>
      )}

      {availableBalance === 0 && !pageAssetBalance.isLoading && (
        <div className="rounded-lg border border-yellow-300/50 bg-yellow-50/50 dark:bg-yellow-900/10 p-4 text-center text-sm text-yellow-700 dark:text-yellow-400">
          You don&apos;t have any page assets available to sell.
        </div>
      )}

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Enter asset description (optional)"
          rows={3}
        />
      </div>

      {/* Amount to sell */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="amountToSell">
            Amount to Sell {pageAssetBalance.data?.code} <span className="text-destructive">*</span>
          </Label>
          <span className="text-xs text-muted-foreground">
            Available: <span className="font-medium text-foreground">{availableBalance}</span>
          </span>
        </div>

        <Controller
          name="amountToSell"
          control={control}
          rules={{
            required: "Amount is required",
            validate: (v) => {
              const available = getAvailable()
              if (!v || v <= 0) return "Amount must be greater than 0"
              if (!Number.isInteger(v)) return "Amount must be a whole number"
              if (v > available) return `Max available is ${available}`
              if (v > 2_147_483_647) return "Amount too large"
              return true
            },
          }}
          render={({ field }) => (
            <div className="relative">
              <Input
                id="amountToSell"
                type="number"
                min={1}
                max={availableBalance}
                step={1}
                disabled={availableBalance === 0}
                placeholder={availableBalance > 0 ? `1 – ${availableBalance}` : "No balance"}
                className={errors.amountToSell ? "border-destructive pr-16" : "pr-16"}
                value={field.value ?? ""}
                onKeyDown={(e) => {
                  // Prevent decimal, minus, plus, scientific notation entirely
                  if ([".", "-", "+", "e", "E"].includes(e.key)) e.preventDefault()
                }}
                onChange={(e) => {
                  // Strip non-digits first (handles paste)
                  const clean = e.target.value.replace(/[^0-9]/g, "")
                  if (clean === "") { field.onChange(undefined); return }
                  const num = parseInt(clean, 10)
                  // Clamp to [1, availableBalance] immediately — RHF never sees the raw value
                  field.onChange(clamp(num))
                }}
                onBlur={field.onBlur}
              />
              {/* Max badge always visible so user knows the ceiling */}
              {availableBalance > 0 && !pageAssetBalance.isLoading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono pointer-events-none select-none">
                  /{availableBalance}
                </span>
              )}
              {pageAssetBalance.isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="loading loading-spinner loading-xs"></span>
                </div>
              )}
            </div>
          )}
        />

        {/* Progress bar showing how much of the balance is being sold */}
        {availableBalance > 0 && watchedAmountToSell > 0 && (
          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={clsx(
                  "h-full rounded-full transition-all duration-200",
                  watchedAmountToSell >= availableBalance
                    ? "bg-orange-500"
                    : watchedAmountToSell / availableBalance > 0.75
                      ? "bg-yellow-500"
                      : "bg-primary"
                )}
                style={{ width: `${Math.min((watchedAmountToSell / availableBalance) * 100, 100)}%` }}
              />
            </div>
            <p className={clsx("text-xs", calculateRemaining() === 0 ? "text-orange-500" : "text-muted-foreground")}>
              {Math.round((watchedAmountToSell / availableBalance) * 100)}% of balance —{" "}
              <span className="font-medium">{calculateRemaining()} remaining</span>
            </p>
          </div>
        )}

        {errors.amountToSell && <p className="text-destructive text-xs">{errors.amountToSell.message}</p>}


      </div>

      {/* ── 2-column pricing grid ── */}
      <div className="rounded-lg border p-4 space-y-3">
        <Label className="text-base font-semibold block">Pricing</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="price">
              {PLATFORM_ASSET.code} Price <span className="text-destructive">*</span>
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
              className={errors.price ? "border-destructive" : ""}
            />
            {errors.price && <p className="text-destructive text-xs">{errors.price.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="priceXLM">Price in XLM</Label>
            <Input
              id="priceXLM"
              type="number"
              step="0.0000001"
              {...register("priceXLM", { valueAsNumber: true })}
              placeholder="0.00"
              className={errors.priceXLM ? "border-destructive" : ""}
            />
            {errors.priceXLM && <p className="text-destructive text-xs">{errors.priceXLM.message}</p>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">XLM price of 0 means not available in XLM</p>
      </div>

      {/* Preview */}
      {watchedPrice > 0 && (
        <div className="rounded-lg border p-4">
          <Label className="text-sm font-semibold block mb-3">Preview</Label>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <div className="text-muted-foreground">Available balance</div>
            <div className="font-medium">{availableBalance} units</div>
            <div className="text-muted-foreground">Amount to sell</div>
            <div className="font-medium">{watchedAmountToSell ?? 0} units</div>
            <div className="text-muted-foreground">Remaining</div>
            <div className={clsx("font-medium", calculateRemaining() === 0 ? "text-orange-500" : "")}>
              {calculateRemaining()} units
            </div>
            <div className="text-muted-foreground">Price per unit</div>
            <div className="font-medium">{watchedPrice ?? 0} {PLATFORM_ASSET.code}</div>
            <div className="text-muted-foreground">XLM price per unit</div>
            <div className="font-medium">{watch("priceXLM") ?? 0} XLM</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitLoading} className="bg-transparent">
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid || submitLoading}>
          {submitLoading && <span className="loading loading-spinner mr-2"></span>}
          Create Listing
        </Button>
      </div>
    </form>
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
    <div className="flex flex-col max-h-[90vh]">
      <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
          ← Back
        </Button>
        <h2 className="text-lg font-bold">Create QR Code Item</h2>
      </div>
      <div className="overflow-y-auto flex-1 px-4 py-4 sm:px-6">
        <QrCodeCreate isAdmin={isAdmin} onClose={onClose} />
      </div>
    </div>
  )
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
    onError: (error) => toast.error(error.message),
  })

  const resetForm = () => {
    setFormData({ title: "", modelUrl: "", externalLink: "", startDate: "", endDate: "" })
    setDescriptions([{ id: "temp-1", title: "", content: "", isCollapsed: false, order: 1 }])
    setErrors({})
  }

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    } else if (formData.title.length > 100) {
      newErrors.title = "Title must be 100 characters or less"
    }

    const descriptionErrors: Record<string, { title?: string; content?: string }> = {}
    let hasValidDescription = false

    descriptions.forEach((desc) => {
      const descError: { title?: string; content?: string } = {}
      if (!desc.title.trim()) {
        descError.title = "Description title is required"
      } else if (desc.title.length > 50) {
        descError.title = "Description title must be 50 characters or less"
      }
      if (!desc.content.trim()) {
        descError.content = "Description content cannot be empty"
      } else if (desc.content.length > 600) {
        descError.content = `Must be 600 characters or less (current: ${desc.content.length})`
      } else if (desc.title.trim()) {
        hasValidDescription = true
      }
      if (descError.title ?? descError.content) descriptionErrors[desc.id] = descError
    })

    if (!hasValidDescription) newErrors.descriptions = descriptionErrors
    else if (Object.keys(descriptionErrors).length > 0) newErrors.descriptions = descriptionErrors

    if (!formData.modelUrl) newErrors.modelUrl = "3D Model is required"
    if (!formData.startDate) newErrors.startDate = "Start date is required"
    if (!formData.endDate) newErrors.endDate = "End date is required"
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = "End date must be after start date"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) { toast.error("Please fix the errors in the form"); return }

    const validDescriptions = descriptions
      .filter((d) => d.title.trim() && d.content.trim())
      .sort((a, b) => a.order - b.order)
      .map((d) => ({ title: d.title.trim(), content: d.content.trim(), order: d.order }))

    createQRItem.mutate({
      title: formData.title,
      descriptions: validDescriptions,
      modelUrl: formData.modelUrl,
      externalLink: formData.externalLink || undefined,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
    })
  }

  const addDescription = () => {
    if (descriptions.length >= 4) { toast.error("Maximum 4 descriptions allowed"); return }
    const updated = descriptions.map((d) => ({ ...d, isCollapsed: true }))
    const nextOrder = Math.max(...descriptions.map((d) => d.order)) + 1
    setDescriptions([...updated, { id: `temp-${Date.now()}`, title: "", content: "", isCollapsed: false, order: nextOrder }])
  }

  const removeDescription = (id: string) => {
    if (descriptions.length <= 1) { toast.error("At least one description is required"); return }
    const remaining = descriptions
      .filter((d) => d.id !== id)
      .sort((a, b) => a.order - b.order)
      .map((d, i) => ({ ...d, order: i + 1 }))
    setDescriptions(remaining)
    if (errors.descriptions) {
      const newErrs = { ...errors.descriptions }
      delete newErrs[id]
      setErrors({ ...errors, descriptions: Object.keys(newErrs).length > 0 ? newErrs : undefined })
    }
  }

  const updateDescription = (id: string, field: "title" | "content", value: string) => {
    setDescriptions(descriptions.map((d) => (d.id === id ? { ...d, [field]: value } : d)))
  }

  const toggleCollapse = (id: string) => {
    setDescriptions(descriptions.map((d) => (d.id === id ? { ...d, isCollapsed: !d.isCollapsed } : d)))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="qr-title">Main Title *</Label>
        <Input
          id="qr-title"
          value={formData.title}
          onChange={(e) => {
            setFormData((p) => ({ ...p, title: e.target.value }))
            if (errors.title) setErrors({ ...errors, title: undefined })
          }}
          placeholder="Enter main item title"
          className={errors.title ? "border-destructive" : ""}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
      </div>

      {/* Descriptions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Descriptions * <span className="text-muted-foreground font-normal">(max 4, 600 chars each)</span></Label>
          <Button
            type="button" variant="outline" size="sm"
            onClick={addDescription} disabled={descriptions.length >= 4}
            className="gap-1.5 bg-transparent"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>

        {descriptions.sort((a, b) => a.order - b.order).map((desc) => (
          <Card key={desc.id} className={clsx("overflow-hidden", errors.descriptions?.[desc.id] ? "border-destructive" : "")}>
            <Collapsible open={!desc.isCollapsed} onOpenChange={() => toggleCollapse(desc.id)}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">#{desc.order}</span>
                    <span>{desc.title.trim() || `Description ${desc.order}`}</span>
                    {desc.content.trim() && (
                      <span className="text-xs text-muted-foreground">({desc.content.length}/600)</span>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        {desc.isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    {descriptions.length > 1 && (
                      <Button
                        type="button" variant="ghost" size="sm"
                        onClick={() => removeDescription(desc.id)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-0 px-4 pb-4 space-y-3">
                  {/* ── 2-column inside each description card ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`dt-${desc.id}`}>Title * <span className="text-xs text-muted-foreground">({desc.title.length}/50)</span></Label>
                      <Input
                        id={`dt-${desc.id}`}
                        value={desc.title}
                        onChange={(e) => updateDescription(desc.id, "title", e.target.value)}
                        placeholder={`Title for description ${desc.order}`}
                        className={errors.descriptions?.[desc.id]?.title ? "border-destructive" : ""}
                      />
                      {errors.descriptions?.[desc.id]?.title && (
                        <p className="text-xs text-destructive">{errors.descriptions[desc.id]?.title}</p>
                      )}
                    </div>
                    <div className="space-y-1.5 sm:col-span-1 col-span-1">
                      <Label htmlFor={`dc-${desc.id}`}>
                        Content *{" "}
                        <span className={clsx("text-xs", desc.content.length > 600 ? "text-destructive" : "text-muted-foreground")}>
                          ({desc.content.length}/600)
                        </span>
                      </Label>
                      <Textarea
                        id={`dc-${desc.id}`}
                        value={desc.content}
                        onChange={(e) => updateDescription(desc.id, "content", e.target.value)}
                        placeholder="Enter content..."
                        rows={3}
                        maxLength={600}
                        className={errors.descriptions?.[desc.id]?.content ? "border-destructive" : ""}
                      />
                      {errors.descriptions?.[desc.id]?.content && (
                        <p className="text-xs text-destructive">{errors.descriptions[desc.id]?.content}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* 3D Model */}
      <div className="space-y-2">
        <Label>3D Model * <span className="text-muted-foreground font-normal text-xs">(GLB format)</span></Label>
        <div className="flex items-center gap-3">
          <Button
            type="button" variant="outline"
            onClick={() => (document.getElementById("qr-model-upload") as HTMLInputElement)?.click()}
            className={clsx("gap-2 bg-transparent", errors.modelUrl ? "border-destructive" : "")}
          >
            <Box className="h-4 w-4" />
            {formData.modelUrl ? "Change Model" : "Upload 3D Model"}
          </Button>
          {formData.modelUrl && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <Box className="h-4 w-4" /> Uploaded
            </span>
          )}
        </div>
        <UploadS3Button
          id="qr-model-upload"
          variant="hidden"
          endpoint="modelUploader"
          onBeforeUploadBegin={(file) => {
            if (!file.name.endsWith(".glb")) { toast.error("Invalid file type. Please upload a .glb file."); return undefined }
            return file
          }}
          onClientUploadComplete={(file) => {
            if (!file) { toast.error("No file uploaded"); return }
            setFormData((p) => ({ ...p, modelUrl: file.url }))
            toast.success("3D Model uploaded successfully!")
          }}
        />
        {errors.modelUrl && <p className="text-xs text-destructive">{errors.modelUrl}</p>}
      </div>

      {/* External link */}
      <div className="space-y-1.5">
        <Label htmlFor="externalLink">External Link <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input
          id="externalLink"
          type="url"
          value={formData.externalLink}
          onChange={(e) => setFormData((p) => ({ ...p, externalLink: e.target.value }))}
          placeholder="https://example.com"
        />
      </div>

      {/* ── 2-column date range ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => {
              setFormData((p) => ({ ...p, startDate: e.target.value }))
              if (errors.startDate) setErrors({ ...errors, startDate: undefined })
            }}
            className={errors.startDate ? "border-destructive" : ""}
          />
          {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">End Date *</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) => {
              setFormData((p) => ({ ...p, endDate: e.target.value }))
              if (errors.endDate) setErrors({ ...errors, endDate: undefined })
            }}
            className={errors.endDate ? "border-destructive" : ""}
          />
          {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="bg-transparent">
          Cancel
        </Button>
        <Button type="submit" disabled={createQRItem.isLoading}>
          {createQRItem.isLoading ? "Creating..." : "Create QR Item"}
        </Button>
      </div>
    </form>
  )
}