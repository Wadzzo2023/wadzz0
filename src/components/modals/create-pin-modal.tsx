"use client"

import { type ChangeEvent, useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, FormProvider, type SubmitHandler, useForm, useFormContext } from "react-hook-form"
import { z } from "zod"
import toast from "react-hot-toast"
import { Loader, MapPin, ImageIcon, Settings, CheckCircle, Coins, Wand2, Calendar } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "~/components/shadcn/ui/dialog"
import { Input } from "~/components/shadcn/ui/input"
import { Label } from "~/components/shadcn/ui/label"
import { Textarea } from "~/components/shadcn/ui/textarea"
import { Button } from "~/components/shadcn/ui/button"
import { useCreatorStorageAcc } from "~/lib/state/wallete/stellar-balances"
import { api } from "~/utils/api"
import { BADWORDS } from "~/utils/banned-word"
import { PinType } from "@prisma/client"
import { useMapInteractionStore } from "~/store/map-stores"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../shadcn/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "../shadcn/ui/card"
import { Badge } from "../shadcn/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../shadcn/ui/tabs"
import CopyCutPinModal from "./copy-cut-pin-modal"
import { UploadS3Button } from "../common/upload-button"
import { Switch } from "../shadcn/ui/switch"
import { LocationAddressDisplay } from "../map/address-display"

// Define types for assets and pins
type AssetType = {
    id: number
    code: string
    issuer: string
    thumbnail: string
}

export const PAGE_ASSET_NUM = -10
export const NO_ASSET = -99

export const createPinFormSchema = z.object({
    lat: z.number().min(-180).max(180),
    lng: z.number().min(-180).max(180),
    description: z.string().optional(),
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
    image: z.string().url().optional(),
    startDate: z.date(),
    endDate: z.date().min(new Date(new Date().setHours(0, 0, 0, 0)), "End date cannot be in the past"),
    url: z.string().url("Please enter a valid URL").optional(),
    autoCollect: z.boolean(),
    token: z.number().optional(),
    tokenAmount: z.number().nonnegative().optional(),
    pinNumber: z.number().nonnegative().min(1, "Number of pins must be at least 1"),
    radius: z.number().nonnegative("Radius cannot be negative").default(50), // Set default radius to 50
    pinCollectionLimit: z.number().min(1, "Collection limit must be greater than 0"),
    tier: z.string().optional(),
    multiPin: z.boolean().default(false),
    type: z.nativeEnum(PinType).default(PinType.OTHER),
})
type CreatePinType = z.infer<typeof createPinFormSchema>

export default function CreatePinModal() {
    const { isOpenCreatePin, closeCreatePinModal, manual, position, duplicate, prevData, copiedPinData } =
        useMapInteractionStore()

    const [coverUrl, setCover] = useState<string | undefined>()
    const [selectedToken, setSelectedToken] = useState<(AssetType & { bal: number }) | undefined>()
    const [remainingBalance, setRemainingBalance] = useState<number>(0)
    const [collectionMode, setCollectionMode] = useState<"manual" | "auto">("manual")
    const [currentStep, setCurrentStep] = useState<number>(1)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    console.log("CreatePinModal rendered with position:", isOpenCreatePin)

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Format dates for datetime-local input (YYYY-MM-DDTHH:MM)
    const formatDateForInput = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        const hours = String(date.getHours()).padStart(2, "0")
        const minutes = String(date.getMinutes()).padStart(2, "0")
        return `${year}-${month}-${day}T${hours}:${minutes}`
    }

    const methods = useForm<z.infer<typeof createPinFormSchema>>({
        resolver: zodResolver(createPinFormSchema),
        defaultValues: {
            lat: position?.lat,
            lng: position?.lng,
            radius: 50,
            pinNumber: 1,
            pinCollectionLimit: 0,
            description: prevData?.description ?? "",
            autoCollect: prevData?.autoCollect ?? false,
            startDate: prevData?.startDate ?? today,
            endDate: prevData?.endDate ?? tomorrow,
            multiPin: prevData?.multiPin ?? false,
            type: PinType.OTHER,
            url: "",
        },
    })

    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        reset,
        trigger,
        control,
        setError,
        watch,
        formState: { errors },
    } = methods

    const tokenAmount = watch("pinCollectionLimit")

    const assetsQuery = api.fan.asset.myAssets.useQuery(undefined, {})

    const addPinM = api.maps.pin.createPin.useMutation({
        onSuccess: () => {
            console.log("Pin sent for approval")
            closeCreatePinModal()
        },
        onError: (err) => {
            console.error(`Failed to create pin: ${err.message}`)
        },
    })

    const resetState = () => {
        reset()
        setCover(undefined)
        setSelectedToken(undefined)
        setRemainingBalance(0)
        setCollectionMode("manual")
        setCurrentStep(1)
    }

    const nextStep = async () => {
        const isStepValid = await trigger()
        if (isStepValid && currentStep < 2) {
            setCurrentStep(currentStep + 1)
        }
    }

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const onSubmit: SubmitHandler<z.infer<typeof createPinFormSchema>> = (data) => {
        if (selectedToken && data.pinCollectionLimit && data.pinCollectionLimit > selectedToken.bal) {
            setError("pinCollectionLimit", {
                type: "manual",
                message: "Collection limit can't be more than token balance",
            })
            return
        }

        const finalData = { ...data }
        if (position) {
            finalData.lat = position.lat
            finalData.lng = position.lng
        }

        finalData.autoCollect = collectionMode === "auto"
        console.log("Final data to submit:", finalData)
        addPinM.mutate({
            ...finalData,
            description: finalData.description ?? "",
        })
    }

    useEffect(() => {
        if (isOpenCreatePin && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0
        }
        if (isOpenCreatePin) {
            setCurrentStep(1)
        }
        // When duplicating or editing a pin, ensure date fields are Date objects
        const toDate = (d?: string | number | Date | null): Date | undefined => {
            if (d === undefined || d === null) return undefined
            if (d instanceof Date) return d
            if (typeof d === "string" || typeof d === "number") {
                const parsed = new Date(d)
                if (!isNaN(parsed.getTime())) return parsed
            }
            return undefined
        }

        if (prevData) {
            if (prevData.title) setValue("title", prevData.title)
            if (prevData.radius) setValue("radius", prevData.radius)
            if (prevData.description) setValue("description", prevData.description)
            if (prevData.image) setCover(prevData.image)
            if (prevData.image) setValue("image", prevData.image)
            // Normalize dates to Date objects so the datetime-local inputs receive proper values
            const sDate = toDate(prevData.startDate) ?? new Date()
            const eDate = toDate(prevData.endDate) ?? new Date(new Date().setHours(23, 59, 59, 999))
            setValue("startDate", sDate)
            setValue("endDate", eDate)
            if (prevData.url) setValue("url", prevData.url)
            setValue("autoCollect", prevData.autoCollect ?? false)
            // Sync collectionMode UI (tabs) with prevData.autoCollect
            setCollectionMode(prevData.autoCollect ? "auto" : "manual")
            setValue("pinCollectionLimit", prevData.pinCollectionLimit ?? 0)
            if (prevData.tier) setValue("tier", prevData.tier.toString())
            if (prevData.pinNumber) setValue("pinNumber", prevData.pinNumber)
        } if (position) {
            setValue("lat", position.lat)
            setValue("lng", position.lng)
        }
    }, [isOpenCreatePin, duplicate, prevData, position, setValue])

    useEffect(() => {
        if (selectedToken && tokenAmount !== undefined) {
            setRemainingBalance(selectedToken.bal - tokenAmount)
        } else if (selectedToken) {
            setRemainingBalance(selectedToken.bal)
        } else {
            setRemainingBalance(0)
        }
    }, [tokenAmount, selectedToken])

    return (
        <>
            <Dialog
                open={isOpenCreatePin && !copiedPinData}
                onOpenChange={(open) => {
                    if (!open) resetState()
                    closeCreatePinModal()
                }}
            >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-primary">Create New Pin</DialogTitle>
                        <div className="flex items-center justify-center space-x-4 mt-4">
                            <div className="flex items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                        }`}
                                >
                                    1
                                </div>
                                <span className={`ml-2 text-sm ${currentStep >= 1 ? "text-foreground" : "text-muted-foreground"}`}>
                                    Create
                                </span>
                            </div>
                            <div className={`w-8 h-0.5 ${currentStep >= 2 ? "bg-primary" : "bg-muted"}`} />
                            <div className="flex items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                        }`}
                                >
                                    2
                                </div>
                                <span className={`ml-2 text-sm ${currentStep >= 2 ? "text-foreground" : "text-muted-foreground"}`}>
                                    Preview
                                </span>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="overflow-y-auto" ref={scrollContainerRef}>
                        <FormProvider {...methods}>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-1">
                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <Settings className="w-5 h-5 text-primary" />
                                                    Collection Mode
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <Tabs
                                                    value={collectionMode}
                                                    onValueChange={(value) => setCollectionMode(value as "manual" | "auto")}
                                                >
                                                    <TabsList className="grid w-full grid-cols-2">
                                                        <TabsTrigger value="manual">Manual Collect</TabsTrigger>
                                                        <TabsTrigger value="auto">Auto Collect</TabsTrigger>
                                                    </TabsList>

                                                    <TabsContent value="manual" className="mt-4">
                                                        <p className="text-sm text-muted-foreground">
                                                            Users must manually collect rewards when they enter the area
                                                        </p>
                                                    </TabsContent>

                                                    <TabsContent value="auto" className="mt-4">
                                                        <p className="text-sm text-muted-foreground">
                                                            Automatically collect rewards when users enter the area
                                                        </p>
                                                    </TabsContent>
                                                </Tabs>
                                            </CardContent>
                                        </Card>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2 text-lg">
                                                        <MapPin className="w-5 h-5 text-primary" />
                                                        Pin Details
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <ManualCoordinatesInput manual={manual} position={position} />

                                                    <div className="space-y-2">
                                                        <Label htmlFor="title" className="text-sm font-medium">
                                                            Pin Title *
                                                        </Label>
                                                        <Input
                                                            id="title"
                                                            {...register("title")}
                                                            className="bg-input border-border focus:ring-ring"
                                                            placeholder="Enter a catchy title for your pin"
                                                        />
                                                        {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
                                                    </div>

                                                    <div className="space-y-2 relative">
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor="description" className="text-sm font-medium">
                                                                Description
                                                            </Label>

                                                        </div>
                                                        <Textarea
                                                            id="description"
                                                            {...register("description")}
                                                            className="bg-input border-border focus:ring-ring min-h-[100px] resize-none"
                                                            placeholder="Describe what makes this pin special..."
                                                        />
                                                        <EnhanceDescriptionButton className="absolute bottom-2 right-2" />
                                                        {errors.description && (
                                                            <p className="text-destructive text-sm">{errors.description.message}</p>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="pinType" className="text-sm font-medium">
                                                                Pin Type
                                                            </Label>
                                                            <Controller
                                                                name="type"
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                        <SelectTrigger className="bg-input border-border">
                                                                            <SelectValue placeholder="Choose Pin Type" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {Object.values(PinType).map((type) => (
                                                                                <SelectItem key={type} value={type}>
                                                                                    {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="url" className="text-sm font-medium">
                                                                URL / Link
                                                            </Label>
                                                            <Input
                                                                id="url"
                                                                {...register("url")}
                                                                className="bg-input border-border focus:ring-ring"
                                                                placeholder="https://example.com"
                                                            />
                                                            {errors.url && <p className="text-destructive text-sm">{errors.url.message}</p>}
                                                        </div>
                                                    </div>

                                                    <ImageUploadField coverUrl={coverUrl} setCover={setCover} setValue={setValue} />


                                                </CardContent>
                                            </Card>

                                            <div className="flex flex-col gap-8">
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center gap-2 text-lg">
                                                            <Settings className="w-5 h-5 text-primary" />
                                                            Collection & Tier Settings
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="flex flex-col gap-2">
                                                        <TiersOptions />
                                                        <CollectionInputs


                                                            setSelectedToken={setSelectedToken}
                                                            setRemainingBalance={setRemainingBalance}
                                                            assetsQuery={assetsQuery}

                                                            selectedToken={selectedToken}
                                                            remainingBalance={remainingBalance}
                                                        />
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center gap-2 text-lg">
                                                            <Calendar className="w-5 h-5 text-primary" />
                                                            Schedule
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="flex flex-col gap-2">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="startDate" className="text-sm font-medium">
                                                                    Start Date <span className="text-destructive">*</span>
                                                                </Label>
                                                                <Controller
                                                                    name="startDate"
                                                                    control={control}
                                                                    render={({ field }) => (
                                                                        <Input
                                                                            type="datetime-local"
                                                                            id="startDate"
                                                                            value={field.value ? formatDateForInput(new Date(field.value)) : formatDateForInput(today)}
                                                                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                                                const v = e.target.value
                                                                                field.onChange(v ? new Date(v) : undefined)
                                                                            }}
                                                                            className="bg-input border-border focus:ring-ring"
                                                                        />
                                                                    )}
                                                                />
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label htmlFor="endDate" className="text-sm font-medium">
                                                                    End Date <span className="text-destructive">*</span>
                                                                </Label>
                                                                <Controller
                                                                    name="endDate"
                                                                    control={control}
                                                                    render={({ field }) => (
                                                                        <Input
                                                                            type="datetime-local"
                                                                            id="endDate"
                                                                            value={field.value ? formatDateForInput(new Date(field.value)) : formatDateForInput(tomorrow)}
                                                                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                                                const v = e.target.value
                                                                                field.onChange(v ? new Date(v) : undefined)
                                                                            }}
                                                                            className="bg-input border-border focus:ring-ring "
                                                                        />
                                                                    )}
                                                                />
                                                                {errors.endDate && <p className="text-destructive text-sm">{errors.endDate.message}</p>}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>

                                        <PinTypeToggles />
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <CheckCircle className="w-5 h-5 text-primary" />
                                                    Pin Preview
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                                                            {coverUrl ? (
                                                                <img
                                                                    src={coverUrl || "/placeholder.svg"}
                                                                    alt="Pin preview"
                                                                    width={400}
                                                                    height={300}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="text-center text-muted-foreground">
                                                                    <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                                                                    <p className="text-sm">No image uploaded</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="space-y-3">
                                                            <h2 className="text-xl font-bold text-foreground">{getValues("title") || "Pin Title"}</h2>
                                                            <p className="text-muted-foreground">
                                                                {getValues("description")}
                                                            </p>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <Badge variant="outline">{getValues("type")}</Badge>
                                                                <Badge variant={collectionMode === "auto" ? "default" : "secondary"}>
                                                                    {collectionMode === "auto" ? "Auto Collect" : "Manual Collect"}
                                                                </Badge>
                                                                {getValues("multiPin") && <Badge variant="outline">Multi-Pin</Badge>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-3 bg-muted rounded-lg">
                                                            <div className="text-sm text-muted-foreground">Location</div>
                                                            <div className="font-medium">
                                                                {getValues("lat")?.toFixed(6)}, {getValues("lng")?.toFixed(6)}
                                                            </div>
                                                        </div>
                                                        <div className="p-3 bg-muted rounded-lg">
                                                            <div className="text-sm text-muted-foreground">Radius</div>
                                                            <div className="font-medium">{getValues("radius")} meters</div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-3 bg-muted rounded-lg">
                                                            <div className="text-sm text-muted-foreground">Number of Pins</div>
                                                            <div className="font-medium">{getValues("pinNumber")}</div>
                                                        </div>
                                                        <div className="p-3 bg-muted rounded-lg">
                                                            <div className="text-sm text-muted-foreground">Collection Limit</div>
                                                            <div className="font-medium">{getValues("pinCollectionLimit")}</div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-3 bg-muted rounded-lg">
                                                            <div className="text-sm text-muted-foreground">Start Date</div>
                                                            <div className="font-medium text-xs">
                                                                {getValues("startDate")?.toLocaleDateString()}{" "}
                                                                {getValues("startDate")?.toLocaleTimeString()}
                                                            </div>
                                                        </div>
                                                        <div className="p-3 bg-muted rounded-lg">
                                                            <div className="text-sm text-muted-foreground">End Date</div>
                                                            <div className="font-medium text-xs">
                                                                {getValues("endDate")?.toLocaleDateString()}{" "}
                                                                {getValues("endDate")?.toLocaleTimeString()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {getValues("url") && (
                                                        <div className="p-3 bg-muted rounded-lg">
                                                            <div className="text-sm text-muted-foreground">URL</div>
                                                            <div className="font-medium text-sm break-all">{getValues("url")}</div>
                                                        </div>
                                                    )}

                                                    {selectedToken && (
                                                        <div className="p-4 bg-card rounded-lg border">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <Coins className="w-5 h-5 text-accent" />
                                                                <span className="font-medium">Token Details</span>
                                                            </div>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">Asset:</span>
                                                                    <span className="font-medium">{selectedToken.code}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">Available Balance:</span>
                                                                    <span className="font-medium">{selectedToken.bal}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">Collection Limit:</span>
                                                                    <span className="font-medium">{getValues("pinCollectionLimit") || 0}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">Remaining Balance:</span>
                                                                    <span
                                                                        className={`font-medium ${remainingBalance < 0 ? "text-destructive" : "text-accent"}`}
                                                                    >
                                                                        {remainingBalance}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </form>
                        </FormProvider>
                    </div>

                    <DialogFooter className="flex justify-between items-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                resetState()
                                closeCreatePinModal()
                            }}
                            className="border-border"
                        >
                            Cancel
                        </Button>

                        <div className="flex gap-2">
                            {currentStep > 1 && (
                                <Button type="button" variant="outline" onClick={prevStep} className="border-border bg-transparent">
                                    Previous
                                </Button>
                            )}

                            {currentStep < 2 ? (
                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                    Next: Preview
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={() => onSubmit(getValues())}
                                    disabled={addPinM.isLoading || remainingBalance < 0}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                    {addPinM.isLoading && <Loader className="animate-spin mr-2 w-4 h-4" />}
                                    {addPinM.isLoading ? "Creating Pin..." : "Create Pin"}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>

                    {addPinM.isError && (
                        <div className="px-6 pb-2">
                            <p className="text-destructive text-sm">{addPinM.error.message}</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <CopyCutPinModal />
        </>
    )
}

function CollectionInputs({

    setSelectedToken,
    setRemainingBalance,
    assetsQuery,

    selectedToken,
    remainingBalance,
}: {
    setSelectedToken: (asset: (AssetType & { bal: number } | undefined)) => void
    setRemainingBalance: (balance: number) => void
    assetsQuery: {
        data?: {
            pageAsset?: {
                code: string;
                creatorId: string;
                issuer: string;
                thumbnail: string | null;
            }
            shopAsset: AssetType[]
        }
    }

    selectedToken: (AssetType & { bal: number } | undefined)
    remainingBalance: number
}) {
    const { control, register, formState: { errors } } = useFormContext<z.infer<typeof createPinFormSchema>>()
    const { getAssetBalance } = useCreatorStorageAcc()

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-sm font-medium">Choose Token</Label>
                <Controller
                    name="token"
                    control={control}
                    render={({ field }) => (
                        <Select
                            onValueChange={(value) => {
                                const selectedAssetId = Number(value)
                                field.onChange(selectedAssetId === NO_ASSET ? undefined : selectedAssetId)

                                if (selectedAssetId === NO_ASSET) {
                                    setSelectedToken(undefined)
                                    setRemainingBalance(0)
                                    return
                                }

                                if (selectedAssetId === PAGE_ASSET_NUM) {
                                    const pageAsset = assetsQuery.data?.pageAsset
                                    if (pageAsset) {
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
                                        setRemainingBalance(bal)
                                    } else {
                                        toast.error("No page asset found")
                                    }
                                    return
                                }

                                const selectedAsset = assetsQuery.data?.shopAsset.find(
                                    (asset: AssetType) => asset.id === selectedAssetId,
                                )
                                if (selectedAsset) {
                                    const bal = getAssetBalance({
                                        code: selectedAsset.code,
                                        issuer: selectedAsset.issuer,
                                    })
                                    setSelectedToken({ ...selectedAsset, bal: bal })
                                    setRemainingBalance(bal)
                                }
                            }}
                            defaultValue={NO_ASSET.toString()}
                        >
                            <SelectTrigger className="bg-input border-border">
                                <SelectValue placeholder="Choose Token" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NO_ASSET.toString()}>Pin (No asset)</SelectItem>
                                {assetsQuery.data?.pageAsset && (
                                    <SelectItem value={PAGE_ASSET_NUM.toString()}>
                                        {assetsQuery.data.pageAsset.code} - Page Asset
                                    </SelectItem>
                                )}
                                {assetsQuery.data?.shopAsset?.map((asset: AssetType) => (
                                    <SelectItem key={asset.id} value={asset.id.toString()}>
                                        {asset.code}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="radius" className="text-sm font-medium">
                        Radius (meters)
                    </Label>
                    <Input
                        type="number"
                        id="radius"
                        min={0}
                        {...register("radius", { valueAsNumber: true })}
                        className="bg-input border-border focus:ring-ring"
                        placeholder="50"
                    />
                    {errors.radius && <p className="text-destructive text-sm">{errors.radius.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="pinNumber" className="text-sm font-medium">
                        Number of Pins
                    </Label>
                    <Input
                        type="number"
                        id="pinNumber"
                        min={1}
                        {...register("pinNumber", { valueAsNumber: true })}
                        className="bg-input border-border focus:ring-ring"
                        placeholder="1"
                    />
                    {errors.pinNumber && <p className="text-destructive text-sm">{errors.pinNumber.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="pinCollectionLimit" className="text-sm font-medium">
                    Pin Collection Limit
                </Label>
                <Input
                    type="number"
                    id="pinCollectionLimit"
                    min={0}
                    {...register("pinCollectionLimit", { valueAsNumber: true })}
                    className="bg-input border-border focus:ring-ring"
                    placeholder="Enter collection limit"
                />
                {selectedToken && (
                    <div className="text-xs space-y-1 p-2 bg-muted rounded">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Available Balance:</span>
                            <span className="font-medium">{selectedToken.bal}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Remaining Balance:</span>
                            <span className={`font-medium ${remainingBalance < 0 ? "text-destructive" : "text-accent"}`}>
                                {remainingBalance}
                            </span>
                        </div>
                    </div>
                )}
                {selectedToken && remainingBalance < 0 && (
                    <p className="text-destructive text-sm">Insufficient token balance</p>
                )}
                {errors.pinCollectionLimit && <p className="text-destructive text-sm">{errors.pinCollectionLimit.message}</p>}
            </div>
        </div>
    )
}
interface ManualCoordinatesInputProps {
    manual: boolean
    position: { lat: number; lng: number } | undefined

}

function ManualCoordinatesInput({ manual, position }: ManualCoordinatesInputProps) {
    const { register, formState: { errors } } = useFormContext<z.infer<typeof createPinFormSchema>>()
    if (manual) {
        return (
            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-4">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-700">Manual Coordinates</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Latitude</Label>
                            <Input
                                type="number"
                                step={0.0000000000000000001}
                                {...register("lat", { valueAsNumber: true })}
                                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {errors.lat && (
                                <p className="text-red-500 text-sm mt-1 animate-in slide-in-from-top-2 flex items-center gap-1">
                                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                    {errors.lat.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Longitude</Label>
                            <Input
                                type="number"
                                step={0.0000000000000000001}
                                {...register("lng", { valueAsNumber: true })}
                                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {errors.lng && (
                                <p className="text-red-500 text-sm mt-1 animate-in slide-in-from-top-2 flex items-center gap-1">
                                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                    {errors.lng.message}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50/50 to-blue-50/50">
            <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">Selected Location</span>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Latitude:</span>
                        <Badge variant="secondary" className="font-mono text-xs">
                            {position?.lat?.toFixed(6)}
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Longitude:</span>
                        <Badge variant="secondary" className="font-mono text-xs">
                            {position?.lng?.toFixed(6)}
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between">

                        <LocationAddressDisplay latitude={position?.lat ?? 0} longitude={position?.lng ?? 0} />

                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

interface ImageUploadFieldProps {
    coverUrl: string | undefined
    setCover: (url: string | undefined) => void
    setValue: (name: "image", value: string | undefined) => void
}

function ImageUploadField({ coverUrl, setCover, setValue }: ImageUploadFieldProps) {
    return (
        <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Pin Cover Image</Label>
            <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors duration-200">
                <CardContent className="p-6 text-center">
                    <UploadS3Button
                        endpoint="imageUploader"
                        className="w-full"
                        onClientUploadComplete={(res) => {
                            const data = res
                            if (data?.url) {
                                setCover(data.url)
                                setValue("image", data.url)
                            }
                        }}
                        onUploadError={(error: Error) => {
                            console.error(`ERROR! ${error.message}`)
                        }}
                    />
                    {coverUrl && (
                        <div className="mt-6 flex justify-center">
                            <div className="relative group">
                                <img
                                    className="rounded-xl shadow-lg transition-transform duration-200 group-hover:scale-105 border border-gray-200"
                                    width={200}
                                    height={200}
                                    alt="preview image"
                                    src={coverUrl ?? "/placeholder.svg"}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all duration-200 flex items-center justify-center">
                                    <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
                                        Preview
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}


function PinTypeToggles() {
    const { control } = useFormContext<CreatePinType>()
    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
                <Settings className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm font-semibold text-gray-700">Advanced Settings</h4>
            </div>

            <div className="space-y-3">


                <Card className="border border-gray-200 hover:border-blue-300 transition-colors duration-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <Label htmlFor="multiPin" className="text-sm font-medium cursor-pointer text-gray-900">
                                    Multi Pin
                                </Label>
                                <p className="text-xs text-gray-500 mt-1">Allow multiple pins to be collected from this location</p>
                            </div>
                            <Controller
                                name="multiPin"
                                control={control} // Fixed to use control instead of register
                                render={({ field }) => <Switch id="multiPin" checked={field.value} onCheckedChange={field.onChange} />}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
function TiersOptions() {
    const tiersQuery = api.fan.member.getAllMembership.useQuery({})
    const { control } = useFormContext<CreatePinType>()
    if (tiersQuery.isLoading) return <div className="skeleton h-10 w-20"></div>;
    if (tiersQuery.data) {
        return (
            <div className="space-y-2">
                <Label className="text-sm font-medium">Choose Tier</Label>
                <Controller
                    name="tier"
                    control={control}
                    render={({ field }) => (
                        <Select
                            onValueChange={(value) => {
                                field.onChange(value)
                            }}
                        >
                            <SelectTrigger className="bg-input border-border">
                                <SelectValue placeholder="Choose Tier" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="public">Public</SelectItem>
                                <SelectItem value="private">Only Followers</SelectItem>
                                {tiersQuery.data.map((model) => (

                                    <SelectItem key={model.id} value={model.id.toString()}>
                                        {`${model.name} : ${model.price} ${model.creator.pageAsset?.code}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>
            // <div>
            //     <h4 className="text-sm font-semibold text-gray-700">Tier Settings</h4>
            //     <Controller
            //         name="tier"
            //         control={control}
            //         render={({ field }) => (
            //             <select {...field} className="select select-bordered ">
            //                 <option disabled>Choose Tier</option>
            //                 <option value="public">Public</option>
            //                 <option value="private">Only Followers</option>
            //                 {tiersQuery.data.map((model) => (
            //                     <option
            //                         key={model.id}
            //                         value={model.id}
            //                     >{`${model.name} : ${model.price} ${model.creator.pageAsset?.code}`}</option>
            //                 ))}
            //             </select>
            //         )}
            //     />
            // </div>
        );
    }
}

function EnhanceDescriptionButton({ className }: { className?: string }) {
    const { watch, setValue } = useFormContext<z.infer<typeof createPinFormSchema>>()
    const description = watch("description")
    const [isLoading, setIsLoading] = useState(false)
    const enhanceDescriptionMutation = api.pinAgent.enhanceDescription.useMutation({
        onSuccess: (data) => {
            setValue("description", data.enhancedDescription)
            toast.success("Description enhanced!")
        },
        onError: (err) => {
            toast.error(err.message || "Failed to enhance description")
        },
    })

    const handleEnhance = async () => {
        if (!description || description.trim().length === 0) {
            toast.error("Please enter a description first")
            return
        }

        setIsLoading(true)
        enhanceDescriptionMutation.mutate({
            description: description.trim(),
        })
        setIsLoading(false)
    }

    return (
        <Button
            type="button"

            size="sm"
            onClick={handleEnhance}
            disabled={!description || description.trim().length === 0 || enhanceDescriptionMutation.isLoading}
            className={`${className} h-6 w-6 px-2 text-xs gap-1 hover:bg-primary/10  rounded-full`}
        >
            {enhanceDescriptionMutation.isLoading ? (
                <>
                    <Loader className="w-3 h-3 animate-spin" />

                </>
            ) : (
                <>
                    <Wand2 className="w-3 h-3" />

                </>
            )}
        </Button>
    )
}
