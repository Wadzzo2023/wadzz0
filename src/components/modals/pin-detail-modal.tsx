"use client"

import {
    Copy,
    Edit3,
    Loader2,
    MapPin,
    Scissors,
    ShieldBan,
    ShieldCheck,
    Trash2,
    Calendar,
    LinkIcon,
    ImageIcon,
    Users,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Check,
    Info,
} from "lucide-react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import React, { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Button } from "~/components/shadcn/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/shadcn/ui/dialog"
import { api } from "~/utils/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation" // Changed from next/router to next/navigation
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"
import { Input } from "~/components/shadcn/ui/input"
import type { ItemPrivacy } from "@prisma/client" // Added PinType
import { Label } from "~/components/shadcn/ui/label"
import { useCreatorStorageAcc } from "~/lib/state/wallete/stellar-balances"
import { BADWORDS } from "~/utils/banned-word"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/shadcn/ui/tabs"
import { Textarea } from "~/components/shadcn/ui/textarea"
import { Badge } from "~/components/shadcn/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/shadcn/ui/card"
import { Separator } from "~/components/shadcn/ui/separator"
import { useMapInteractionStore } from "~/store/map-stores" // Changed to useMapInteractionStore

// Re-using the Pin type from map-stores.ts for consistency
import type { Location, LocationGroup } from "@prisma/client"
import { PinType as PinTypeEnum } from "@prisma/client" // Declare PinType
import { useCopyCutModalStore } from "~/store/copy-cut-modal-store"
import { UploadS3Button } from "~/pages/test"

type Pin = {
    locationGroup:
    | (LocationGroup & {
        creator: { profileUrl: string | null };
    })
    | null;
    _count: {
        consumers: number;
    };
} & Location;

// Define types for assets and pins
type AssetType = {
    id: number
    code: string
    issuer: string
    thumbnail: string
}

export const PAGE_ASSET_NUM = -10
export const NO_ASSET = -99

const MapOptionModal = () => {
    const {
        selectedPinForDetail: data, // Use selectedPinForDetail from the store as 'data'
        closePinDetailModal: handleClose, // Use closePinDetailModal from the store
        isPinCut,
        isPinCopied,
        setPinCopied,
        setPinCut,
        setIsAutoCollect, // This is for the copiedPinData, not the current pin's autoCollect
        setManual,
        setDuplicate,
        setPrevData,
    } = useMapInteractionStore()

    const [isFormLocal, setIsFormLocal] = React.useState(false) // Local state for form view
    const session = useSession()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<string>("details")
    const utils = api.useUtils()
    const pinM = api.maps.pin.getPinM.useMutation({
        onSuccess: (data) => {
            setPrevData(data)
            handleClose() // Close current modal
            setManual(true) // Set manual mode for new pin creation
            setDuplicate(true) // Indicate it's a duplicate operation
            // The create pin modal will open automatically due to `setManual(true)`
            toast.success("Pin duplicated successfully")
        },
    })

    const pinE = api.maps.pin.getPinM.useMutation({
        onSuccess: (data) => {
            // When editing, we set the form data and switch to form view
            // The data from pinE.mutate is the full pin object, which is what PinInfoUpdate expects
            setPrevData(data) // Set prevData for the form to pre-fill
            setIsFormLocal(true) // Switch to form view
        },
    })

    const ToggleAutoCollectMutation = api.maps.pin.toggleAutoCollect.useMutation({
        onSuccess: () => {
            toast.success(`Auto collect ${data?.autoCollect ? "disabled" : "enabled"} successfully`)
            handleClose() // Close the modal after action
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const handleToggleAutoCollect = async (pinId: string | undefined) => {
        if (pinId && data?.locationGroup) {
            ToggleAutoCollectMutation.mutate({
                id: pinId,
                isAutoCollect: !data.autoCollect, // Toggle based on current state
            })
        } else {
            toast.error("Pin Id not found or data is incomplete.")
        }
    }

    const handleCopyPin = () => {
        if (data) {
            navigator.clipboard.writeText(data.id) // Copy pin ID
            setPinCopied(true, data) // Set copied state and store pin data
            toast.success("Pin ID copied to clipboard")

        } else {
            toast.error("No pin selected to copy.")
        }
    }

    const DeletePin = api.maps.pin.deletePin.useMutation({
        onSuccess: async (data) => {
            if (data.item) {
                await utils.maps.pin.getCreatorPins.refetch()

                toast.success("Pin deleted successfully")
                handleClose()
            } else {
                toast.error("Pin not found or You are not authorized to delete this pin")
            }
        },
        onError: (error) => {
            toast.error(error.message)
            console.error(error)
        },
    })

    const handleDelete = () => {
        if (data?.id) {
            DeletePin.mutate({ id: data.id })
        } else {
            toast.error("No pin selected to delete.")
        }
    }

    const handleCutPin = () => {
        if (data) {
            setPinCut(true, data) // Set cut state and store pin data

            toast.success("Pin ready to move")

        } else {
            toast.error("No pin selected to cut.")
        }
    }

    // If no pin is selected, don't render the modal
    if (!data) {
        return null
    }

    // Check for user session before rendering actions that require it
    if (!session?.data?.user?.id) {
        // If no session, only show details, or a message
        // For now, we'll just return null if no data, as the parent handles open/close
        // and this component only renders if data is present.
        // If you want to show a "login to edit" message, you'd put it here.
    }

    return (
        <AnimatePresence>
            <Dialog open={!!data && !isPinCopied && !isPinCut} onOpenChange={() => {
                setIsFormLocal(false)
                handleClose()
            }}>
                <DialogContent className="m-auto flex max-h-[90vh] w-full max-w-2xl flex-col p-0 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col h-full"
                    >
                        <DialogHeader className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4">
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <MapPin className="h-5 w-5 " />
                                {isFormLocal ? "Edit Pin" : (data?.locationGroup?.title ?? "Pin Details")}
                            </DialogTitle>
                        </DialogHeader>
                        {isFormLocal && data.id ? (
                            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                                <PinInfoUpdate
                                    autoCollect={data.autoCollect ?? false}
                                    multiPin={data.locationGroup?.multiPin ?? false}
                                    lat={data.latitude}
                                    long={data.longitude}
                                    id={data.id}
                                    image={data.locationGroup?.image ?? ""}
                                    description={data.locationGroup?.description ?? ""}
                                    title={data.locationGroup?.title ?? ""}
                                    startDate={data.locationGroup?.startDate}
                                    endDate={data.locationGroup?.endDate}
                                    collectionLimit={data.locationGroup?.limit}
                                    remainingLimit={data.locationGroup?.remaining}
                                    link={data.locationGroup?.link}
                                    assetId={data?.locationGroup?.assetId}
                                    privacy={data.locationGroup?.privacy}
                                    handleClose={() => setIsFormLocal(false)} // Only close the form, not the whole modal
                                    isLoading={pinE.isLoading}
                                    type={data.locationGroup?.type} // Pass the pin type
                                />
                            </div>
                        ) : (
                            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                                <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-4">
                                        <TabsTrigger
                                            value="details"
                                            className="data-[state=active]:bg-primary data-[state=active]:shadow-sm data-[state=active]:shadow-foreground"
                                        >
                                            Pin Details
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="actions"
                                            className="data-[state=active]:bg-primary data-[state=active]:shadow-sm data-[state=active]:shadow-foreground"
                                        >
                                            Actions
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="details" className="mt-0">
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                            <PinInfo data={data} isLoading={pinE.isLoading || pinM.isLoading} />
                                        </motion.div>
                                    </TabsContent>
                                    <TabsContent value="actions" className="mt-0">
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                            className="grid grid-cols-1 md:grid-cols-2 gap-2"
                                        >
                                            <Button
                                                variant="outline"
                                                className="flex h-auto items-center justify-start gap-2 py-3 bg-transparent"
                                                onClick={() => {
                                                    if (data.id) {
                                                        pinE.mutate(data.id)
                                                    }
                                                }}
                                                disabled={pinE.isLoading}
                                            >
                                                {pinE.isLoading ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                        <div className="text-left">
                                                            <div className="font-medium">Loading...</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="rounded-full bg-primary/10 p-2">
                                                            <Edit3 size={18} className="" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-medium">Edit Pin</div>
                                                            <div className="text-xs text-muted-foreground">Modify pin details</div>
                                                        </div>
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                type="button"
                                                className="flex h-auto items-center justify-start gap-2 py-3 bg-transparent"
                                                onClick={() => {
                                                    data.id && pinM.mutate(data.id)
                                                }}
                                                disabled={pinM.isLoading}
                                            >
                                                {pinM.isLoading ? (
                                                    <Loader2 className="h-5 w-5 " />
                                                ) : (
                                                    <>
                                                        <div className="rounded-full bg-primary/10 p-2">
                                                            <Copy size={18} className="" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-medium">Duplicate Pin</div>
                                                            <div className="text-xs text-muted-foreground">Create a copy of this pin</div>
                                                        </div>
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex h-auto items-center justify-start gap-2 py-3 bg-transparent"
                                                onClick={handleCopyPin}
                                                disabled={isPinCopied}
                                            >
                                                {isPinCopied ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="rounded-full bg-green-100 p-2">
                                                            <Check size={18} className="text-green-600" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-medium">Copied!</div>
                                                            <div className="text-xs text-muted-foreground">Pin ID copied to clipboard</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="rounded-full bg-primary/10 p-2">
                                                            <Copy size={18} className="" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-medium">Copy Pin ID</div>
                                                            <div className="text-xs text-muted-foreground">Copy pin identifier</div>
                                                        </div>
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex h-auto items-center justify-start gap-2 py-3 bg-transparent"
                                                onClick={handleCutPin}
                                                disabled={isPinCut}
                                            >
                                                {isPinCut ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="rounded-full bg-green-100 p-2">
                                                            <Check size={18} className="text-green-600" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-medium">Cut!</div>
                                                            <div className="text-xs text-muted-foreground">Pin ready to move</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="rounded-full bg-primary/10 p-2">
                                                            <Scissors size={18} className="" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-medium">Cut Pin</div>
                                                            <div className="text-xs text-muted-foreground">Move pin to new location</div>
                                                        </div>
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex h-auto items-center justify-start gap-2 py-3 bg-transparent"
                                                onClick={() => {
                                                    handleClose()
                                                    router.push(`/report/${data.id}`)

                                                }}
                                            >
                                                <div className="rounded-full bg-primary/10 p-2">
                                                    <Users size={18} className="" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-medium">Show Collectors</div>
                                                    <div className="text-xs text-muted-foreground">View who collected this pin</div>
                                                </div>
                                            </Button>
                                            <Button
                                                variant={data?.autoCollect ? "destructive" : "outline"}
                                                className="flex h-auto items-center justify-start gap-2 py-3"
                                                onClick={() => handleToggleAutoCollect(data.id)}
                                                disabled={ToggleAutoCollectMutation.isLoading}
                                            >
                                                {ToggleAutoCollectMutation.isLoading ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                        <div className="text-left">
                                                            <div className="font-medium">Updating...</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div
                                                            className={`${data.autoCollect ? "bg-destructive/20" : "bg-primary/10"} rounded-full p-2`}
                                                        >
                                                            {data.autoCollect ? (
                                                                <ShieldBan size={18} className="text-destructive-foreground" />
                                                            ) : (
                                                                <ShieldCheck size={18} className="" />
                                                            )}
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-medium">
                                                                {data?.autoCollect ? "Disable" : "Enable"} Auto Collect
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {data?.autoCollect ? "Turn off" : "Turn on"} automatic collection
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                className="col-span-1 flex h-auto items-center justify-start gap-2 py-3 md:col-span-2"
                                                onClick={handleDelete}
                                                disabled={DeletePin.isLoading || data.hidden}
                                            >
                                                {DeletePin.isLoading ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="h-5 w-5 animate-spin text-destructive-foreground" />
                                                        <div className="text-left">
                                                            <div className="font-medium">Deleting...</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="rounded-full bg-destructive/20 p-2">
                                                            <Trash2 size={18} className="text-destructive-foreground" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-medium">Delete Pin</div>
                                                            <div className="text-xs text-destructive-foreground/80">Permanently remove this pin</div>
                                                        </div>
                                                    </>
                                                )}
                                            </Button>
                                        </motion.div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        )}
                    </motion.div>
                </DialogContent>
            </Dialog>
        </AnimatePresence>
    )
}

export default MapOptionModal

function PinInfo({
    data,
    isLoading = false,
}: {
    data: Pin // Use the consistent Pin type
    isLoading?: boolean
}) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="relative h-48 w-full animate-pulse overflow-hidden rounded-lg bg-gray-200"></div>
                <Card>
                    <CardHeader className="pb-2">
                        <div className="h-6 w-24 animate-pulse rounded bg-gray-200"></div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                        <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
                        <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <div className="h-6 w-24 animate-pulse rounded bg-gray-200"></div>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-2 h-4 w-full animate-pulse rounded bg-gray-200"></div>
                        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
                    </CardContent>
                </Card>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="h-6 w-24 animate-pulse rounded bg-gray-200"></div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
                            <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="h-6 w-24 animate-pulse rounded bg-gray-200"></div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
                            <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
                            <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }
    const { locationGroup } = data
    if (!locationGroup) return null // Should not happen if data is properly loaded

    return (
        <div className="space-y-4">
            {locationGroup.image && (
                <div className="relative h-48 w-full overflow-hidden rounded-lg">
                    <img
                        src={locationGroup.image ?? "/placeholder.svg"}
                        alt={locationGroup.title ?? "Pin image"}

                        className="object-cover h-full w-full"
                    />
                </div>
            )}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Location</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <span className="text-muted-foreground">Latitude:</span>
                        <Badge variant="outline" className="ml-2 font-mono">
                            {data.latitude?.toFixed(6)}
                        </Badge>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Longitude:</span>
                        <Badge variant="outline" className="ml-2 font-mono">
                            {data.longitude?.toFixed(6)}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
            {locationGroup.description && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">{locationGroup.description}</p>
                    </CardContent>
                </Card>
            )}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="h-4 w-4 " />
                            Dates
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div>
                            <span className="text-muted-foreground">Start:</span>{" "}
                            {locationGroup.startDate ? new Date(locationGroup.startDate).toLocaleDateString() : "Not set"}
                        </div>
                        <div>
                            <span className="text-muted-foreground">End:</span>{" "}
                            {locationGroup.endDate ? new Date(locationGroup.endDate).toLocaleDateString() : "Not set"}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-4 w-4 " />
                            Collection
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div>
                            <span className="text-muted-foreground">Limit:</span> {data.locationGroup?.limit ?? "Unlimited"}
                        </div>
                        <div>
                            <span className="text-muted-foreground">Remaining:</span> {locationGroup.remaining ?? "Unlimited"}
                        </div>
                        <div>
                            <span className="text-muted-foreground">Auto Collect:</span>{" "}
                            <Badge variant={data.autoCollect ? "default" : "outline"}>
                                {data.autoCollect ? "Enabled" : "Disabled"}
                            </Badge>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Multi Pin:</span>{" "}
                            <Badge variant={locationGroup.multiPin ? "default" : "outline"}>
                                {locationGroup.multiPin ? "Enabled" : "Disabled"}
                            </Badge>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Type:</span>{" "}
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                {locationGroup.type.charAt(0).toUpperCase() + locationGroup.type.slice(1).toLowerCase()}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {locationGroup.link && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <LinkIcon className="h-4 w-4 " />
                            Link
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <a
                            href={locationGroup.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm hover:underline"
                        >
                            {locationGroup.link}
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export const updateMapFormSchema = z.object({
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
    description: z.string().optional(), // Made optional
    title: z
        .string()
        .min(3, "Title must be at least 3 characters long")
        .refine(
            (value) => {
                return !BADWORDS.some((word) => value.toLowerCase().includes(word.toLowerCase()))
            },
            {
                message: "Input contains banned words.",
            },
        ),
    image: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z
        .date()
        .min(new Date(new Date().setHours(0, 0, 0, 0)), "End date cannot be in the past")
        .optional(),
    url: z.string().url().optional(),
    autoCollect: z.boolean(),
    multiPin: z.boolean().optional(),
    pinRemainingLimit: z.number().optional(),
    type: z.nativeEnum(PinTypeEnum).default(PinTypeEnum.OTHER), // Added new type field
})

type FormData = z.infer<typeof updateMapFormSchema>

function PinInfoUpdate({
    image,
    description,
    title,
    id,
    startDate,
    endDate,
    collectionLimit,
    remainingLimit,
    multiPin,
    autoCollect,
    lat,
    long,
    link,
    assetId,
    privacy,
    handleClose,
    isLoading = false,
    type, // Receive the pin type
}: {
    image?: string
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
    link?: string | null | undefined
    assetId?: number | null | undefined
    privacy?: ItemPrivacy
    handleClose: () => void
    isLoading?: boolean
    type?: PinTypeEnum // Add type to props
}) {
    console.log("auto collect, multipin", autoCollect, multiPin)
    const [coverUrl, setCover] = React.useState("")
    const { selectedPinForDetail, closePinDetailModal } = useMapInteractionStore() // Use store for modal state
    const utils = api.useUtils()
    const [selectedToken, setSelectedToken] = useState<AssetType & { bal: number }>()
    const [activeStep, setActiveStep] = useState<string>("basic")
    const { getAssetBalance } = useCreatorStorageAcc()
    const [isInitialLoad, setIsInitialLoad] = useState(true)

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
        register,
        setError,
        setValue,
        watch,
        getValues,
    } = useForm<FormData>({
        resolver: zodResolver(updateMapFormSchema),
        defaultValues: {
            title: title ?? "",
            description: description ?? "",
            startDate: startDate,
            endDate: endDate,
            image: image ?? "",
            autoCollect: autoCollect ?? false,
            pinId: id,
            lat: lat ?? 0,
            lng: long ?? 0,
            url: link ?? "",
            pinRemainingLimit: remainingLimit,
            type: type ?? PinTypeEnum.OTHER, // Set default type
            multiPin: multiPin ?? false,
        },
    })


    const tiers = api.fan.member.getAllMembership.useQuery({})
    const assets = api.fan.asset.myAssets.useQuery(undefined, {
        enabled: !!selectedPinForDetail, // Enable query only when modal is open
    })

    const update = api.maps.pin.updatePin.useMutation({
        onSuccess: async (updatedData) => {
            await utils.maps.pin.getMyPins.refetch()
            await utils.maps.pin.getCreatorPins.refetch()

            toast.success("Pin updated successfully")
            closePinDetailModal() // Close the main modal
            handleClose() // Close the form view
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = (formData: FormData) => {
        formData.image = coverUrl || image
        // Ensure description is always a string
        console.log("Submitting form data:", formData)
        update.mutate({
            ...formData,
            description: formData.description ?? "" // Provide empty string as fallback
        })
    }

    // Format dates for input fields
    const formatDateForInput = (date: Date | undefined) => {
        if (!date) return ""
        return date.toISOString().split("T")[0]
    }

    const handleBackToDetails = () => {
        handleClose() // This will set isFormLocal to false in the parent
    }

    const handleTokenOptionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedAssetId = Number(event.target.value)

        if (selectedAssetId === NO_ASSET) {
            setSelectedToken(undefined)
            // setValue("token", undefined); // No token field in update schema
            return
        }

        const pageAsset = assets.data?.pageAsset
        if (selectedAssetId === PAGE_ASSET_NUM && pageAsset) {
            const bal = getAssetBalance({
                code: pageAsset.code,
                issuer: pageAsset.issuer,
            })
            setSelectedToken({
                bal,
                code: pageAsset.code,
                issuer: pageAsset.issuer,
                id: PAGE_ASSET_NUM,
                thumbnail: pageAsset.thumbnail ?? "",
            })
            // setValue("token", PAGE_ASSET_NUM); // No token field in update schema
            return
        }

        const selectedShopAsset = assets.data?.shopAsset.find((asset) => asset.id === selectedAssetId)
        if (selectedShopAsset) {
            const bal = getAssetBalance({
                code: selectedShopAsset.code,
                issuer: selectedShopAsset.issuer,
            })
            setSelectedToken({ ...selectedShopAsset, bal: bal })
            // setValue("token", selectedShopAsset.id); // No token field in update schema
        } else {
            setSelectedToken(undefined)
            // setValue("token", undefined); // No token field in update schema
        }
    }

    useEffect(() => {
        // Only load the media from the server on the first load
        if (image && isInitialLoad) {
            setCover(image)
            setIsInitialLoad(false) // After loading, mark initial load as done
        }
    }, [image, isInitialLoad])

    useEffect(() => {
        // Pre-fill form fields when data changes (e.g., when editing a new pin)
        setValue("title", title ?? "")
        setValue("description", description ?? "")
        setValue("startDate", startDate)
        setValue("endDate", endDate)
        setValue("image", image)
        setValue("autoCollect", autoCollect ?? false)
        setValue("pinId", id)
        setValue("lat", lat ?? 0)
        setValue("lng", long ?? 0)
        setValue("url", link ?? "")
        setValue("pinRemainingLimit", remainingLimit)
        setValue("type", type ?? PinTypeEnum.OTHER) // Set type
        setCover(image ?? "") // Set cover image for preview
        setValue("multiPin", multiPin ?? false)
    }, [title, description, startDate, endDate, image, autoCollect, multiPin, id, lat, long, link, remainingLimit, type, setValue])

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-8 w-full animate-pulse rounded bg-gray-200 mb-4"></div>
                <div className="space-y-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                    <div className="h-10 w-full animate-pulse rounded bg-gray-200"></div>
                </div>
                <div className="space-y-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                    <div className="h-24 w-full animate-pulse rounded bg-gray-200"></div>
                </div>
                <div className="space-y-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                    <div className="h-10 w-full animate-pulse rounded bg-gray-200"></div>
                </div>
            </div>
        )
    }
    return (
        <div className="space-y-4">
            <Tabs defaultValue="basic" value={activeStep} onValueChange={setActiveStep} className="w-full">
                <TabsList className="mb-4 grid w-full grid-cols-3">
                    <TabsTrigger value="basic" className="data-[state=active]:bg-primary/20">
                        Basic Info
                    </TabsTrigger>
                    <TabsTrigger value="location" className="data-[state=active]:bg-primary/20">
                        Location
                    </TabsTrigger>
                    <TabsTrigger value="collection" className="data-[state=active]:bg-primary/20">
                        Collection
                    </TabsTrigger>
                </TabsList>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <TabsContent value="basic" className="mt-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="title" className="flex items-center gap-2 text-sm font-medium">
                                    <span className="">Title</span>
                                </Label>
                                <Input id="title" {...register("title")} placeholder="Enter pin title" />
                                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium">
                                    <span className="">Description</span>
                                </Label>
                                <Textarea
                                    id="description"
                                    {...register("description")}
                                    placeholder="Describe what this pin is about..."
                                    className="min-h-24"
                                />
                                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="url" className="flex items-center gap-2 text-sm font-medium">
                                    <LinkIcon className="h-4 w-4 " />
                                    <span>URL / Link</span>
                                </Label>
                                <Input id="url" {...register("url")} placeholder="https://example.com" />
                                {errors.url && <p className="text-sm text-destructive">{errors.url.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-sm font-medium">
                                    <ImageIcon className="h-4 w-4 " />
                                    <span>Pin Cover Image</span>
                                </Label>
                                <div className="flex flex-col gap-2">
                                    <UploadS3Button
                                        endpoint="imageUploader"
                                        onClientUploadComplete={(res) => {
                                            if (res?.url) {
                                                setCover(res.url)
                                                setValue("image", res.url)
                                            }
                                        }}
                                        onUploadError={(error: Error) => {
                                            toast.error(`ERROR! ${error.message}`)
                                        }}
                                    />
                                    <AnimatePresence>
                                        {(coverUrl || image) && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.2 }}
                                                className="mt-2 rounded-lg border p-2"
                                            >
                                                <img
                                                    className="rounded  "
                                                    width={120}
                                                    height={120}
                                                    alt="preview image"
                                                    src={coverUrl ?? image ?? "/placeholder.svg"}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                            {/* New Pin Type Selection */}
                            <div>
                                <Label htmlFor="pinType">Pin Type</Label>
                                <Controller
                                    name="type"
                                    control={control}
                                    render={({ field }) => (
                                        <select
                                            {...field}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {Object.values(PinTypeEnum).map((type) => (
                                                <option key={type} value={type}>
                                                    {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                />
                                {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
                            </div>
                        </motion.div>
                    </TabsContent>
                    <TabsContent value="location" className="mt-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="lat" className="flex items-center gap-2 text-sm font-medium">
                                        <MapPin className="h-4 w-4 " />
                                        <span>Latitude</span>
                                    </Label>
                                    <Input
                                        id="lat"
                                        type="number"
                                        step={0.0000000000000000001}
                                        {...register("lat", { valueAsNumber: true })}
                                    />
                                    {errors.lat && <p className="text-sm text-destructive">{errors.lat.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lng" className="flex items-center gap-2 text-sm font-medium">
                                        <MapPin className="h-4 w-4 " />
                                        <span>Longitude</span>
                                    </Label>
                                    <Input
                                        id="lng"
                                        type="number"
                                        step={0.0000000000000000001}
                                        {...register("lng", { valueAsNumber: true })}
                                    />
                                    {errors.lng && <p className="text-sm text-destructive">{errors.lng.message}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="startDate" className="flex items-center gap-2 text-sm font-medium">
                                    <Calendar className="h-4 w-4 " />
                                    <span>Start Date</span>
                                </Label>
                                <Controller
                                    name="startDate"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="date"
                                            id="startDate"
                                            value={formatDateForInput(field.value)}
                                            onChange={(e) => {
                                                field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                                            }}
                                        />
                                    )}
                                />
                                {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate" className="flex items-center gap-2 text-sm font-medium">
                                    <Calendar className="h-4 w-4 " />
                                    <span>End Date</span>
                                </Label>
                                <Controller
                                    name="endDate"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="date"
                                            id="endDate"
                                            value={formatDateForInput(field.value)}
                                            onChange={(e) => {
                                                field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                                            }}
                                        />
                                    )}
                                />
                                {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
                            </div>
                        </motion.div>
                    </TabsContent>
                    <TabsContent value="collection" className="mt-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Collection Limits</CardTitle>
                                    <CardDescription>Original Limit: {collectionLimit ?? "Unlimited"}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <Label htmlFor="pinRemainingLimit" className="text-sm font-medium">
                                            Remaining Limit
                                        </Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            id="pinRemainingLimit"
                                            {...register("pinRemainingLimit", {
                                                valueAsNumber: true,
                                                min: 0,
                                                max: 2147483647,
                                            })}
                                            max={2147483647}
                                        />
                                        {errors.pinRemainingLimit && (
                                            <p className="text-sm text-destructive">{errors.pinRemainingLimit.message}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="flex items-center space-x-2 rounded-lg border p-4">
                                <input
                                    type="checkbox"
                                    id="autoCollect"
                                    {...register("autoCollect")}
                                    className="h-4 w-4 rounded border-gray-300  focus:ring-primary"
                                />
                                <div>
                                    <Label htmlFor="autoCollect" className="text-sm font-medium">
                                        Auto Collect
                                    </Label>
                                    <p className="text-xs text-muted-foreground">Automatically collect when in range</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 rounded-lg border p-4">
                                <input
                                    type="checkbox"
                                    id="multiPin"
                                    {...register("multiPin")}
                                    className="h-4 w-4 rounded border-gray-300  focus:ring-primary"
                                />
                                <div>
                                    <Label htmlFor="multiPin" className="text-sm font-medium">
                                        Multi Pin
                                    </Label>
                                    <p className="text-xs text-muted-foreground">Allow multiple pins to be created</p>
                                </div>
                            </div>
                        </motion.div>
                    </TabsContent>
                    <Separator className="my-6" />
                    <div className="flex items-center justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleBackToDetails}
                            className="flex items-center gap-1 bg-transparent"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back to Details
                        </Button>
                        <div className="flex items-center gap-2">
                            {activeStep !== "basic" && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        if (activeStep === "location") setActiveStep("basic")
                                        if (activeStep === "collection") setActiveStep("location")
                                    }}
                                    className="flex items-center gap-1"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                            )}
                            {activeStep !== "collection" ? (
                                <Button
                                    type="button"
                                    onClick={() => {
                                        if (activeStep === "basic") setActiveStep("location")
                                        if (activeStep === "location") setActiveStep("collection")
                                    }}
                                    className="flex items-center gap-1"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={() => onSubmit(getValues())}
                                    disabled={isSubmitting} className="flex items-center gap-1">
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        "Update Pin"
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                    {update.isError && (
                        <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-destructive">
                            <p>{update.error.message}</p>
                        </div>
                    )}
                </form>
            </Tabs>
        </div>
    )
}
