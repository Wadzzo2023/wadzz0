"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { z } from "zod"
import { Button } from "~/components/shadcn/ui/button"
import { Input } from "~/components/shadcn/ui/input"
import { Label } from "~/components/shadcn/ui/label"
import { Textarea } from "~/components/shadcn/ui/textarea"
import { useSession } from "next-auth/react"
import { api } from "~/utils/api"
import { BADWORDS } from "~/utils/banned-word"

interface SellPageAsset {
    id: number
    title: string
    description: string | null
    amountToSell: number
    price: number
    priceUSD: number
    priceXLM: number
    isSold: boolean
    placedAt: Date
    soldAt: Date | null
}

interface SellPageAssetUpdateProps {
    asset: SellPageAsset
    onClose: () => void
}

export default function SellPageAssetUpdate({ asset, onClose }: SellPageAssetUpdateProps) {
    const session = useSession()
    const [submitLoading, setSubmitLoading] = useState(false)
    const [pageAsset, setPageAsset] = useState<string | null>(null)

    const UpdateSellPageAssetSchema = z.object({
        title: z
            .string()
            .min(1, { message: "Title is required" })
            .refine(
                (value) => {
                    return !BADWORDS.some((word) => value.toLowerCase().includes(word.toLowerCase()))
                },
                {
                    message: "Title contains banned words.",
                },
            ),
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
            .positive({ message: "USD price must be greater than 0" }),
        priceXLM: z
            .number({
                required_error: "XLM price must be entered as a number",
                invalid_type_error: "XLM price must be entered as a number",
            })
            .nonnegative({ message: "XLM price cannot be negative" }),
    })

    type UpdateSellPageAssetFormData = z.infer<typeof UpdateSellPageAssetSchema>

    const validateAmountToSell = (value: number) => {
        const availableBalance = pageAsset ? Number.parseInt(pageAsset) : 0
        const totalAvailable = availableBalance + asset.amountToSell // Add back the current amount
        if (value > totalAvailable) {
            return "Amount exceeds available balance"
        }
        return true
    }

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        setValue,
        watch,
    } = useForm<UpdateSellPageAssetFormData>({
        resolver: zodResolver(UpdateSellPageAssetSchema),
        mode: "onChange",
        defaultValues: {
            title: asset.title,
            description: asset.description ?? "",
            amountToSell: asset.amountToSell,
            price: asset.price,
            priceUSD: asset.priceUSD,
            priceXLM: asset.priceXLM,
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

    const updateSellPageAsset = api.fan.asset.updateSellPageAsset.useMutation({
        onSuccess: () => {
            toast.success("Asset Updated Successfully", {
                position: "top-center",
                duration: 4000,
            })
            onClose()
        },
        onError: (error) => {
            toast.error(`Failed to update asset: ${error.message}`)
        },
        onSettled: () => {
            setSubmitLoading(false)
        },
    })

    const calculateRemaining = () => {
        const availableBalance = pageAsset ? Number.parseInt(pageAsset) : 0
        const totalAvailable = availableBalance + asset.amountToSell
        const amountToSell = watchedAmountToSell ?? 0
        return Math.max(0, totalAvailable - amountToSell)
    }

    const totalAvailableBalance = pageAsset ? Number.parseInt(pageAsset) + asset.amountToSell : asset.amountToSell

    const onSubmit = (data: UpdateSellPageAssetFormData) => {
        if (!session.data?.user?.id) {
            toast.error("You must be logged in to update an asset")
            return
        }

        setSubmitLoading(true)

        updateSellPageAsset.mutate({
            id: asset.id,
            ...data,
        })
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

                {/* Asset Information Section */}
                <div className="rounded-lg bg-base-200 p-4 space-y-4">
                    <Label className="text-base font-bold">Asset Information</Label>

                    <div className="space-y-2">
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
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
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
                            Amount to Sell <span className="text-red-600">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="amountToSell"
                                type="number"
                                min="1"
                                max={totalAvailableBalance}
                                step="1"
                                {...register("amountToSell", {
                                    valueAsNumber: true,
                                    validate: validateAmountToSell,
                                })}
                                placeholder="Enter quantity to sell"
                                className={errors.amountToSell ? "border-red-500" : ""}
                            />
                        </div>

                        {/* Balance Information */}
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                                Total Available: <span className="font-medium text-foreground">{totalAvailableBalance}</span>
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
                        {totalAvailableBalance > 0 && (
                            <div className="flex gap-2 mt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setValue("amountToSell", Math.floor(totalAvailableBalance * 0.25))}
                                    className="text-xs"
                                >
                                    25%
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setValue("amountToSell", Math.floor(totalAvailableBalance * 0.5))}
                                    className="text-xs"
                                >
                                    50%
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setValue("amountToSell", Math.floor(totalAvailableBalance * 0.75))}
                                    className="text-xs"
                                >
                                    75%
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setValue("amountToSell", totalAvailableBalance)}
                                    className="text-xs"
                                >
                                    Max
                                </Button>
                            </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                            Note: Your current listing amount ({asset.amountToSell}) is added back to your available balance.
                        </p>
                    </div>
                </div>

                {/* Pricing Section */}
                <div className="rounded-lg bg-base-200 p-4 space-y-4">
                    <Label className="text-base font-bold">Pricing Information</Label>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">
                                Platform Price <span className="text-red-600">*</span>
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

                        <div className="space-y-2">
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
                        </div>

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
                </div>

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
                        Update Asset
                    </Button>
                </div>
            </form>

            {/* Preview Section */}
            {watchedPrice > 0 && (
                <div className="rounded-lg bg-base-100 p-4 border">
                    <Label className="text-base font-bold mb-2 block">Preview</Label>
                    <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p>
                                    <strong>Total Available:</strong> {totalAvailableBalance} units
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
                                <p>
                                    <strong>USD Price per Unit:</strong> ${watchedPriceUSD ?? 0}
                                </p>
                                <p>
                                    <strong>XLM Price per Unit:</strong> {watch("priceXLM") ?? 0} XLM
                                </p>
                            </div>
                        </div>
                        <div className="border-t pt-2 mt-2">
                            <p>
                                <strong>Total Value:</strong> {(watchedPrice ?? 0) * (watchedAmountToSell ?? 0)} platform tokens
                            </p>
                            <p>
                                <strong>Total USD Value:</strong> ${((watchedPriceUSD ?? 0) * (watchedAmountToSell ?? 0)).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
