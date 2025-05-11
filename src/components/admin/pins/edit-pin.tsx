"use client"

import React, { useState, useEffect } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { toast } from "react-hot-toast"
import { Loader } from "lucide-react"
import Image from "next/image"
import { Label } from "~/components/shadcn/ui/label"
import { Input } from "~/components/shadcn/ui/input"
import { api } from "~/utils/api"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/shadcn/ui/dialog"
import { Button } from "~/components/shadcn/ui/button"
import { BADWORDS } from "~/utils/banned-word"
import { useCreatorStorageAcc } from "~/lib/state/wallete/stellar-balances"
import { UploadS3Button } from "~/pages/test"
import { ItemPrivacy } from "@prisma/client"


type AssetType = {
    id: number
    code: string
    issuer: string
    thumbnail: string
}

const updateMapFormSchema = z.object({
    pinId: z.string(),
    lat: z
        .number({
            message: "Latitude is required",
        })
        .min(-180)
        .max(180),
    lng: z
        .number({
            message: "Longitude is required",
        })
        .min(-180)
        .max(180),
    description: z.string(),
    title: z
        .string()
        .min(3)
        .refine(
            (value) => {
                return !BADWORDS.some((word) => value.includes(word))
            },
            {
                message: "Input contains banned words.",
            },
        ),
    image: z.string().url().optional(),
    startDate: z.date().optional(),
    endDate: z
        .date()
        .min(new Date(new Date().setHours(0, 0, 0, 0)))
        .optional(),
    url: z.string().url().optional(),
    autoCollect: z.boolean(),
    pinRemainingLimit: z.number().optional(),
})

type FormData = z.infer<typeof updateMapFormSchema>

interface PinInfoUpdateModalProps {
    isOpen: boolean
    onClose: () => void
    pinData: {
        image: string
        title: string
        description: string
        id: string
        startDate?: Date
        endDate?: Date
        collectionLimit?: number
        remainingLimit?: number
        multiPin?: boolean
        autoCollect?: boolean
        lat?: number
        long?: number

        link?: string

    }
}

export function PinInfoUpdateModal({ isOpen, onClose, pinData }: PinInfoUpdateModalProps) {
    const {
        image,
        description,
        title,
        id,
        startDate,
        endDate,
        collectionLimit,
        remainingLimit,

        autoCollect,
        lat,
        long,

        link,

    } = pinData

    const [coverUrl, setCover] = React.useState("")
    const utils = api.useUtils()

    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const {
        control,
        handleSubmit,
        formState: { errors },
        register,
        setError,
        setValue,
        reset,
    } = useForm({
        resolver: zodResolver(updateMapFormSchema),
        defaultValues: {
            title: title ?? "",
            description: description ?? "",
            startDate: startDate,
            endDate: endDate,
            image: image,
            autoCollect: autoCollect ?? false,
            pinId: id,
            lat: lat ?? 0,
            lng: long ?? 0,
            url: link ?? "",
            pinRemainingLimit: remainingLimit,
        },
    })
    const tiers = api.fan.member.getAllMembership.useQuery()
    const assets = api.fan.asset.myAssets.useQuery(undefined, {})

    const update = api.maps.pin.updatePin.useMutation({
        onSuccess: async (updatedData) => {
            await utils.maps.pin.getMyPins.refetch()
            toast.success("Pin updated successfully")
            onClose()
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = (formData: FormData) => {
        console.log(formData)
        update.mutate(formData)
    }

    useEffect(() => {
        // Only load the media from the server on the first load
        if (image && isInitialLoad) {
            setCover(image ?? "")
            setIsInitialLoad(false) // After loading, mark initial load as done
        }
    }, [image, isInitialLoad])

    // Reset form when modal opens with new pin data
    useEffect(() => {
        if (isOpen) {
            reset({
                title: title ?? "",
                description: description ?? "",
                startDate: startDate,
                endDate: endDate,
                image: image,
                autoCollect: autoCollect ?? false,
                pinId: id,
                lat: lat ?? 0,
                lng: long ?? 0,
                url: link ?? "",
                pinRemainingLimit: remainingLimit,
            })
            setCover(image ?? "")
        }
    }, [isOpen, reset, title, description, startDate, endDate, image, autoCollect, id, lat, long, link, remainingLimit])

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Pin Information</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex flex-col space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium">Latitude</label>
                                <input
                                    type="number"
                                    step={0.0000000000000000001}
                                    {...register("lat", { valueAsNumber: true })}
                                    className="input input-bordered"
                                />
                                {errors.lat && <p className="text-red-500">{errors.lat.message}</p>}
                            </div>
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium">Longitude</label>
                                <input
                                    step={0.0000000000000000001}
                                    type="number"
                                    {...register("lng", { valueAsNumber: true })}
                                    className="input input-bordered"
                                />
                                {errors.lng && <p className="text-red-500">{errors.lng.message}</p>}
                            </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                            <label htmlFor="title" className="text-sm font-medium">
                                Title
                            </label>
                            <input type="text" id="title" {...register("title")} className="input input-bordered" />
                            {errors.title && <p className="text-red-500">{errors.title.message}</p>}
                        </div>

                        <div className="flex flex-col space-y-2">
                            <label htmlFor="description" className="text-sm font-medium">
                                Description
                            </label>
                            <textarea id="description" {...register("description")} className="input input-bordered min-h-[100px]" />
                            {errors.description && <p className="text-red-500">{errors.description.message}</p>}
                        </div>

                        <label className="form-control w-full">
                            <div className="label">
                                <span className="label-text">Update Remaining limit</span>
                            </div>
                            <p>Original Limit: {collectionLimit}</p>

                            <input
                                type="number"
                                min={0}
                                id="perUserTokenAmount"
                                {...register("pinRemainingLimit", {
                                    valueAsNumber: true,
                                    min: 0,
                                    max: 2147483647,
                                })}
                                className="input input-bordered"
                                max={2147483647}
                            />

                            {errors.pinRemainingLimit && (
                                <div className="label">
                                    <span className="label-text-alt text-red-500">{errors.pinRemainingLimit.message}</span>
                                </div>
                            )}
                        </label>

                        <div className="mt-2">
                            <label className="text-sm font-medium">Pin Cover Image</label>

                            <div className="flex items-center gap-4 mt-2">
                                <UploadS3Button
                                    endpoint="imageUploader"
                                    onClientUploadComplete={(res) => {
                                        const data = res

                                        if (data?.url) {
                                            setCover(data.url)
                                            setValue("image", data.url)
                                        }
                                    }}
                                    onUploadError={(error: Error) => {
                                        toast.error(`ERROR! ${error.message}`)
                                    }}
                                />

                                {coverUrl && (
                                    <div className="border rounded p-2">
                                        <Image
                                            width={80}
                                            height={80}
                                            alt="preview image"
                                            src={coverUrl || "/placeholder.svg"}
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                            <label htmlFor="url" className="text-sm font-medium">
                                URL / LINK
                            </label>
                            <input id="url" {...register("url")} className="input input-bordered" />
                            {errors.url && <p className="text-red-500">{errors.url.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Controller
                                    name="startDate"
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Input
                                            type="date"
                                            onChange={(e) => onChange(new Date(e.target.value))}
                                            value={value instanceof Date ? value.toISOString().split("T")[0] : ""}
                                        />
                                    )}
                                />
                                {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Controller
                                    name="endDate"
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Input
                                            type="date"
                                            onChange={(e) => onChange(new Date(e.target.value))}
                                            value={value instanceof Date ? value.toISOString().split("T")[0] : ""}
                                        />
                                    )}
                                />
                                {errors.endDate && <p className="text-sm text-red-500">{errors.endDate.message}</p>}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input type="checkbox" id="autoCollect" {...register("autoCollect")} className="checkbox" />
                            <label htmlFor="autoCollect" className="text-sm">
                                Auto Collect
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={update.isLoading}>
                            {update.isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>

                    {update.isError && <p className="text-red-500 mt-2">{update.failureReason?.message}</p>}
                </form>
            </DialogContent>
        </Dialog>
    )
}

