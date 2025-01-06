import { SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon } from 'lucide-react'
import { useSession } from "next-auth/react"

import { WalletType, clientsign } from "package/connect_wallet"
import { useRef, useState } from "react"
import { toast } from "react-hot-toast"
import { z } from "zod"
import { PLATFORM_ASSET, PLATFORM_FEE, TrxBaseFeeInPlatformAsset } from "~/lib/stellar/constant"
import { AccountSchema, clientSelect } from "~/lib/stellar/fan/utils"

import { ipfsHashToUrl } from "~/utils/ipfs"
import { UploadS3Button } from "~/pages/test"
import { Input } from "~/components/shadcn/ui/input"
import { Label } from "~/components/shadcn/ui/label"

import { Textarea } from "~/components/shadcn/ui/textarea"
import { api } from "~/utils/api"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "~/components/shadcn/ui/select";
import Image from "next/image"
import { Button } from "~/components/shadcn/ui/button"
import useNeedSign from "~/lib/hook"
import { PaymentChoose, usePaymentMethodStore } from "~/components/payment/payment-options"
import { Alert } from "~/components/shadcn/ui/alert"
import RechargeLink from "~/components/marketplace/recharge/link"
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances"
export const SongFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    artist: z.string().min(2, "Artist must be at least 2 characters"),
    musicUrl: z.string({
        required_error:
            "Music file is required",
    }),
    description: z.string(),
    coverImgUrl: z.string({
        required_error:
            "Cover image is required",
    }),
    albumId: z.number(),
    price: z.number({
        required_error:
            "Price is required",
    }).nonnegative({
        message: "Price must be a positive number",

    }),
    priceUSD: z.number({
        required_error:
            "USD Price is required",
    }).nonnegative({
        message: "Price must be a positive number",
    }),
    limit: z.number({
        required_error:
            "Limit is required",
    }).nonnegative({
        message: "Limit must be a positive number",
    }),
    code: z.string({
        required_error:
            "Asset name is required",
    }).min(4, {
        message: "Asset name must be at least 4 characters",
    }).max(12, {
        message: "Asset name must be at most 12 characters",
    }),
    issuer: AccountSchema.optional(),
    tier: z.string().optional(),
})

type SongFormType = z.infer<typeof SongFormSchema>

export default function SongCreate({ albumId, onSuccess }: { albumId: number; onSuccess: () => void }) {
    const [file, setFile] = useState<File>()
    const [ipfs, setIpfs] = useState<string>()
    const [uploading, setUploading] = useState(false)
    const inputFile = useRef<HTMLInputElement>(null)
    const [musicUrl, setMusicUrl] = useState<string>()
    const [coverImgUrl, setCover] = useState<string>()
    const [tier, setTier] = useState<string>();
    const [submitLoading, setSubmitLoading] = useState(false);
    const { needSign } = useNeedSign();
    const { paymentMethod, setIsOpen: setPaymentModalOpen } =
        usePaymentMethodStore();

    const session = useSession()
    const { platformAssetBalance } = useUserStellarAcc();
    const totalFeees = Number(TrxBaseFeeInPlatformAsset) + Number(PLATFORM_FEE);

    const tiers = api.fan.member.getAllMembership.useQuery();
    const { data: requiredTokenAmount, isLoading: requiredTokenAmountLoading } = api.fan.trx.getRequiredPlatformAsset.useQuery({
        xlm: 2,
    }, {
        enabled: !!albumId,
    });

    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        reset,
        formState: { errors, isValid },
    } = useForm<SongFormType>({
        mode: "onChange",

        resolver: zodResolver(SongFormSchema),
        defaultValues: { albumId, price: 2, priceUSD: 2 },
    })

    const addSong = api.fan.music.create.useMutation({
        onSuccess: () => {
            toast.success("Song added")
            reset()
            onSuccess()
            setPaymentModalOpen(false)

        },
    })

    const xdrMutation = api.fan.trx.createUniAssetTrx.useMutation({
        onSuccess(data, variables, context) {
            const { issuer, xdr } = data;
            setValue("issuer", issuer);

            setSubmitLoading(true);

            toast.promise(
                clientsign({
                    presignedxdr: xdr,
                    pubkey: session.data?.user.id,
                    walletType: session.data?.user.walletType,
                    test: clientSelect(),
                })
                    .then((res) => {
                        if (res) {
                            setValue("tier", tier);
                            const data = getValues();
                            addSong.mutate({ ...data });
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

    const onSubmit = () => {
        if (ipfs) {
            xdrMutation.mutate({
                code: getValues("code"),
                limit: getValues("limit"),
                signWith: needSign(),
                ipfsHash: ipfs,
                native: paymentMethod === "xlm",
            })
        } else {
            toast.error("Please upload a thumbnail image.")
        }
    }

    const uploadFile = async (fileToUpload: File) => {
        try {
            setUploading(true)
            const formData = new FormData()
            formData.append("file", fileToUpload, fileToUpload.name)
            const res = await fetch("/api/file", {
                method: "POST",
                body: formData,
            })
            const ipfsHash = await res.text()
            const thumbnail = ipfsHashToUrl(ipfsHash)
            setCover(thumbnail)
            setIpfs(ipfsHash)
            setValue("coverImgUrl", thumbnail)
            setUploading(false)
        } catch (e) {
            console.error(e)
            setUploading(false)
            toast.error("Trouble uploading file")
        }
    }

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            const file = files[0]
            if (file) {
                if (file.size > 1024 * 1024) {
                    toast.error("File size should be less than 1MB")
                    return
                }
                setFile(file)
                await uploadFile(file)
            }
        }
    }

    if (requiredTokenAmountLoading) {
        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {tiers.data && (
                    <TiersOptions
                        handleTierChange={(value: string) => {
                            setTier(value);
                        }}
                        tiers={tiers.data}
                    />
                )}
                <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" {...register("name")} placeholder="Enter Music Name" />
                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div>
                    <Label htmlFor="artist">Artist</Label>
                    <Input id="artist" {...register("artist")} placeholder="Enter Artist Name" />
                </div>



                <div>
                    <Label htmlFor="musicFile">Music File</Label>
                    <UploadS3Button
                        endpoint="musicUploader"
                        onClientUploadComplete={(res) => {
                            const data = res
                            if (data?.url) {
                                setMusicUrl(data.url)
                                setValue("musicUrl", data.url)
                            }
                        }}
                        onUploadError={(error: Error) => {
                            toast.error(`ERROR! ${error.message}`)
                        }}
                    />
                    {musicUrl && (
                        <audio controls className="mt-2 w-full">
                            <source src={musicUrl} type="audio/mpeg" />
                        </audio>
                    )}
                </div>

                <div>
                    <Label htmlFor="code">Asset Name</Label>
                    <Input id="code" {...register("code")} placeholder="Enter Asset Name" />
                    {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
                </div>

                <div>
                    <Label htmlFor="limit">Limit</Label>
                    <Input
                        id="limit"
                        type="number"
                        {...register("limit", { valueAsNumber: true })}
                        placeholder="Enter limit of the new Asset"
                    />
                    {errors.limit && <p className="text-sm text-red-500">{errors.limit.message}</p>}
                </div>

                <div>
                    <Label htmlFor="price">Price in {PLATFORM_ASSET.code}</Label>
                    <Input
                        id="price"
                        type="number"
                        step="0.1"
                        {...register("price", { valueAsNumber: true })}
                        placeholder="Price"
                    />
                    {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
                </div>

                <div>
                    <Label htmlFor="priceUSD">Price in USD</Label>
                    <Input
                        id="priceUSD"
                        type="number"
                        step="0.1"
                        {...register("priceUSD", { valueAsNumber: true })}
                        placeholder="Price"
                    />
                    {errors.priceUSD && <p className="text-sm text-red-500">{errors.priceUSD.message}</p>}
                </div>

                <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        {...register("description")}
                        placeholder="Write a short Description"
                    />
                    {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
                </div>


            </form>

        )
    }
    if (requiredTokenAmount)
        return (
            <div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {tiers.data && (
                        <TiersOptions
                            handleTierChange={(value: string) => {
                                setTier(value);
                            }}
                            tiers={tiers.data}
                        />
                    )}
                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" {...register("name")} placeholder="Enter Music Name" />
                        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </div>

                    <div>
                        <Label htmlFor="artist">Artist</Label>
                        <Input id="artist" {...register("artist")} placeholder="Enter Artist Name" />
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
                                required
                            />
                            {uploading && <progress className="progress w-56"></progress>}
                        </div>
                        {coverImgUrl && (
                            <div className="mt-4 ">
                                <Image
                                    width={120}
                                    height={120}
                                    alt="preview image"
                                    src={coverImgUrl}
                                    className="rounded"
                                />
                            </div>
                        )}
                        {
                            errors.coverImgUrl && (
                                <p className="text-sm text-red-500">{errors.coverImgUrl.message}</p>
                            )
                        }
                    </div>

                    <div>
                        <Label htmlFor="musicFile">Music File</Label>
                        <UploadS3Button
                            endpoint="musicUploader"
                            onClientUploadComplete={(res) => {
                                const data = res
                                if (data?.url) {
                                    setMusicUrl(data.url)
                                    setValue("musicUrl", data.url)
                                }
                            }}
                            onUploadError={(error: Error) => {
                                toast.error(`ERROR! ${error.message}`)
                            }}
                        />
                        {musicUrl && (
                            <audio controls className="mt-2 w-full">
                                <source src={musicUrl} type="audio/mpeg" />
                            </audio>
                        )}
                        {
                            errors.musicUrl && (
                                <p className="text-sm text-red-500">{errors.musicUrl.message}</p>
                            )
                        }
                    </div>

                    <div>
                        <Label htmlFor="code">Asset Name</Label>
                        <Input id="code" {...register("code")} placeholder="Enter Asset Name" />
                        {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
                    </div>

                    <div>
                        <Label htmlFor="limit">Limit</Label>
                        <Input
                            id="limit"
                            type="number"
                            {...register("limit", { valueAsNumber: true })}
                            placeholder="Enter limit of the new Asset"
                        />
                        {errors.limit && <p className="text-sm text-red-500">{errors.limit.message}</p>}
                    </div>

                    <div>
                        <Label htmlFor="price">Price in {PLATFORM_ASSET.code}</Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.1"
                            {...register("price", { valueAsNumber: true })}
                            placeholder="Price"
                        />
                        {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
                    </div>

                    <div>
                        <Label htmlFor="priceUSD">Price in USD</Label>
                        <Input
                            id="priceUSD"
                            type="number"
                            step="0.1"
                            {...register("priceUSD", { valueAsNumber: true })}
                            placeholder="Price"
                        />
                        {errors.priceUSD && <p className="text-sm text-red-500">{errors.priceUSD.message}</p>}
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            {...register("description")}
                            placeholder="Write a short Description"
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
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
                                amount: paymentMethod === "asset" ? requiredTokenAmount : 4,
                                highlighted: false,
                                type: "total",
                            },
                        ]}
                        XLM_EQUIVALENT={4}
                        handleConfirm={handleSubmit(onSubmit)}
                        loading={xdrMutation.isLoading || addSong.isLoading}
                        requiredToken={requiredTokenAmount}
                        trigger={
                            <Button
                                disabled={xdrMutation.isLoading || addSong.isLoading || requiredTokenAmount > platformAssetBalance || !isValid}
                                className="w-full"
                            >
                                {(xdrMutation.isLoading || addSong.isLoading) && (
                                    <span className="loading loading-spinner mr-2"></span>
                                )}                                Add Music Asset
                            </Button>
                        }
                    />

                </form>

                {requiredTokenAmount && requiredTokenAmount > platformAssetBalance && <RechargeLink />}

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
            <div className="">
                <Label htmlFor="tier">Select Tier</Label>
                <Select onValueChange={handleTierChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a tier" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
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
            </div>
        </>
    );
}