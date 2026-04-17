"use client"

import { type ChangeEvent, useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, FormProvider, type SubmitHandler, useForm, useFormContext } from "react-hook-form"
import { z } from "zod"
import toast from "react-hot-toast"
import {
    Loader, MapPin, ImageIcon, Settings, CheckCircle, Coins, Wand2,
    Repeat, Timer, Hexagon, Square, Circle, Pentagon,
    ChevronRight, Zap, CalendarClock, Clock
} from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../shadcn/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "../shadcn/ui/card"
import { Badge } from "../shadcn/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../shadcn/ui/tabs"
import { UploadS3Button } from "../common/upload-button"
import { Switch } from "../shadcn/ui/switch"

// ─── Types ────────────────────────────────────────────────────────────────────

type AssetType = {
    id: number
    code: string
    issuer: string
    thumbnail: string
}

export type HotspotShape = "circle" | "rectangle" | "polygon"

export const PAGE_ASSET_NUM = -10
export const NO_ASSET = -99

// ─── Schema ───────────────────────────────────────────────────────────────────

export const createHotspotFormSchema = z.object({
    // Pin fields
    description: z.string().optional(),
    title: z
        .string()
        .min(3, "Title must be at least 3 characters long")
        .refine(
            (value) => !BADWORDS.some((word) => value.toLowerCase().includes(word.toLowerCase())),
            { message: "Input contains banned words." },
        ),
    image: z.string().url().optional(),
    url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
    autoCollect: z.boolean().default(false),
    token: z.number().optional(),
    tokenAmount: z.number().nonnegative().optional(),
    pinNumber: z.number().nonnegative().min(1, "Number of pins must be at least 1").default(1),
    pinCollectionLimit: z.number().min(0).default(0),
    tier: z.string().optional(),
    multiPin: z.boolean().default(false),
    type: z.nativeEnum(PinType).default(PinType.OTHER),

    // Hotspot-specific fields
    hotspotShape: z.enum(["circle", "rectangle", "polygon"]).default("polygon"),
    dropEveryDays: z.number().min(1, "Must be at least 1 day").default(1),
    pinDurationDays: z.number().min(1, "Must be at least 1 day").default(3),
    hotspotStartDate: z.date(),
    hotspotEndDate: z.date(),
    geoJson: z.custom<GeoJSON.Feature | null>((val) => val === null || typeof val === "object").optional(),
})

type CreateHotspotType = z.infer<typeof createHotspotFormSchema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateHotspotModalProps {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    /** GeoJSON Feature representing the drawn shape (circle / rect / polygon) */
    hotspotData: GeoJSON.Feature | null
    /** Shape type selected by the user on the map */
    shape?: HotspotShape
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateForInput(date: Date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    const hh = String(date.getHours()).padStart(2, "0")
    const mm = String(date.getMinutes()).padStart(2, "0")
    return `${y}-${m}-${d}T${hh}:${mm}`
}


// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreateHotspotModal({
    isOpen,
    setIsOpen,
    hotspotData,
    shape = "circle",
}: CreateHotspotModalProps) {
    const [coverUrl, setCover] = useState<string | undefined>()
    const [selectedToken, setSelectedToken] = useState<(AssetType & { bal: number }) | undefined>()
    const [remainingBalance, setRemainingBalance] = useState<number>(0)
    const [collectionMode, setCollectionMode] = useState<"manual" | "auto">("manual")
    const [currentStep, setCurrentStep] = useState<number>(1)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const today = new Date()
    const inOneYear = new Date(today)
    inOneYear.setFullYear(inOneYear.getFullYear() + 1)

    const methods = useForm<CreateHotspotType>({
        resolver: zodResolver(createHotspotFormSchema),
        defaultValues: {
            pinNumber: 1,
            pinCollectionLimit: 0,
            autoCollect: false,
            multiPin: false,
            type: PinType.OTHER,
            hotspotShape: shape,
            dropEveryDays: 1,
            pinDurationDays: 3,
            hotspotStartDate: today,
            hotspotEndDate: inOneYear,
            url: "",
        },
    })

    const {
        register, handleSubmit, setValue, getValues, reset,
        trigger, control, setError, watch, formState: { errors },
    } = methods

    const tokenAmount = watch("pinCollectionLimit")
    const dropEveryDays = watch("dropEveryDays")
    const pinDurationDays = watch("pinDurationDays")
    const hotspotStartDate = watch("hotspotStartDate")
    const hotspotEndDate = watch("hotspotEndDate")

    const assetsQuery = api.fan.asset.myAssets.useQuery(undefined, {})

    const addHotspotM = api.maps.pin.createHotspot.useMutation({
        onSuccess: () => {
            toast.success("Hotspot created!")
            handleClose()
        },
        onError: (err) => {
            toast.error(`Failed to create hotspot: ${err.message}`)
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
        const valid = await trigger()
        console.log("Validation result:", valid, errors)
        if (valid && currentStep < 2) setCurrentStep(2)
    }

    const prevStep = () => { if (currentStep > 1) setCurrentStep(1) }

    const onSubmit: SubmitHandler<CreateHotspotType> = (data) => {
        if (selectedToken && data.pinCollectionLimit > selectedToken.bal) {
            setError("pinCollectionLimit", {
                type: "manual",
                message: "Collection limit can't exceed token balance",
            })
            return
        }

        addHotspotM.mutate({
            ...data,
            autoCollect: collectionMode === "auto",
            description: data.description ?? "",
            url: data.url ?? "",
            geoJson: hotspotData,  // raw GeoJSON Feature from the map draw tool
        })
    }

    const handleClose = () => {
        resetState()
        setIsOpen(false)
    }

    useEffect(() => {
        if (selectedToken && tokenAmount !== undefined) {
            setRemainingBalance(selectedToken.bal - tokenAmount)
        } else if (selectedToken) {
            setRemainingBalance(selectedToken.bal)
        } else {
            setRemainingBalance(0)
        }
    }, [tokenAmount, selectedToken])

    // Sync shape from prop
    useEffect(() => {
        if (shape) setValue("hotspotShape", shape)
    }, [shape, setValue])

    // Estimated total drops (used in preview)
    const totalEstimatedDrops = (() => {
        if (!hotspotStartDate || !hotspotEndDate) return null
        const start = new Date(hotspotStartDate).getTime()
        const end = new Date(hotspotEndDate).getTime()
        const diffDays = Math.floor((end - start) / 86_400_000)
        if (diffDays < 0) return null
        return Math.floor(diffDays / (dropEveryDays ?? 1)) + 1
    })()

    const scheduleInterval = dropEveryDays === 1 ? "Daily" : `Every ${dropEveryDays} days`

    const shapeIcon = {
        circle: <Circle className="w-4 h-4" />,
        rectangle: <Square className="w-4 h-4" />,
        polygon: <Pentagon className="w-4 h-4" />,
    }[getValues("hotspotShape") ?? "circle"]

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                        <Hexagon className="w-6 h-6 text-primary" />
                        Create Hotspot
                    </DialogTitle>
                    {/* Step indicator */}
                    <div className="flex items-center justify-center space-x-4 mt-4">
                        {[{ n: 1, label: "Configure" }, { n: 2, label: "Preview" }].map(({ n, label }, i, arr) => (
                            <div key={n} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                                    ${currentStep >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                    {n}
                                </div>
                                <span className={`ml-2 text-sm ${currentStep >= n ? "text-foreground" : "text-muted-foreground"}`}>
                                    {label}
                                </span>
                                {i < arr.length - 1 && (
                                    <div className={`w-8 h-0.5 ml-4 ${currentStep >= n + 1 ? "bg-primary" : "bg-muted"}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </DialogHeader>

                <div className="overflow-y-auto" ref={scrollContainerRef}>
                    <FormProvider {...methods}>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-1">

                            {/* ── STEP 1 ──────────────────────────────────────────────── */}
                            {currentStep === 1 && (
                                <div className="space-y-6">

                                    {/* Collection Mode */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <Settings className="w-5 h-5 text-primary" />
                                                Collection Mode
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Tabs value={collectionMode} onValueChange={(v) => setCollectionMode(v as "manual" | "auto")}>
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
                                                        Rewards are collected automatically when users enter the area
                                                    </p>
                                                </TabsContent>
                                            </Tabs>
                                        </CardContent>
                                    </Card>

                                    {/* Hotspot Schedule — sits right below Collection Mode */}
                                    <Card className="border-primary/30 bg-primary/5">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-lg text-primary">
                                                <CalendarClock className="w-5 h-5 text-primary" />
                                                Hotspot Schedule
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {/* Hotspot Start */}
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">
                                                        Hotspot Start <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Controller
                                                        name="hotspotStartDate"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Input
                                                                type="datetime-local"
                                                                value={field.value ? formatDateForInput(new Date(field.value)) : formatDateForInput(today)}
                                                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                                    field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                                                                }}
                                                                className="bg-input border-border focus:ring-ring"
                                                            />
                                                        )}
                                                    />
                                                </div>

                                                {/* Hotspot End */}
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">
                                                        Hotspot End <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Controller
                                                        name="hotspotEndDate"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Input
                                                                type="datetime-local"
                                                                value={field.value ? formatDateForInput(new Date(field.value)) : formatDateForInput(inOneYear)}
                                                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                                    field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                                                                }}
                                                                className="bg-input border-border focus:ring-ring"
                                                            />
                                                        )}
                                                    />
                                                </div>

                                                {/* Drop frequency */}
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium flex items-center gap-1">
                                                        <Repeat className="w-3.5 h-3.5 text-primary" />
                                                        Drop New Pin Every
                                                    </Label>
                                                    <Controller
                                                        name="dropEveryDays"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Select
                                                                value={String(field.value)}
                                                                onValueChange={(v) => field.onChange(Number(v))}
                                                            >
                                                                <SelectTrigger className="bg-input border-border">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="1">Every day</SelectItem>
                                                                    <SelectItem value="2">Every 2 days</SelectItem>
                                                                    <SelectItem value="3">Every 3 days</SelectItem>
                                                                    <SelectItem value="5">Every 5 days</SelectItem>
                                                                    <SelectItem value="7">Every week</SelectItem>
                                                                    <SelectItem value="14">Every 2 weeks</SelectItem>
                                                                    <SelectItem value="30">Every month</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />
                                                    {errors.dropEveryDays && (
                                                        <p className="text-destructive text-sm">{errors.dropEveryDays.message}</p>
                                                    )}
                                                </div>

                                                {/* Pin duration */}
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium flex items-center gap-1">
                                                        <Timer className="w-3.5 h-3.5 text-primary" />
                                                        Each Pin Active For
                                                    </Label>
                                                    <Controller
                                                        name="pinDurationDays"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Select
                                                                value={String(field.value)}
                                                                onValueChange={(v) => field.onChange(Number(v))}
                                                            >
                                                                <SelectTrigger className="bg-input border-border">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="1">1 day</SelectItem>
                                                                    <SelectItem value="2">2 days</SelectItem>
                                                                    <SelectItem value="3">3 days</SelectItem>
                                                                    <SelectItem value="5">5 days</SelectItem>
                                                                    <SelectItem value="7">1 week</SelectItem>
                                                                    <SelectItem value="14">2 weeks</SelectItem>
                                                                    <SelectItem value="30">1 month</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />
                                                    {errors.pinDurationDays && (
                                                        <p className="text-destructive text-sm">{errors.pinDurationDays.message}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Main grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                        {/* Left: Pin Details */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <MapPin className="w-5 h-5 text-primary" />
                                                    Pin Details
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {/* Shape indicator (read-only) */}
                                                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                                                    {shapeIcon}
                                                    <span className="text-sm text-muted-foreground capitalize">
                                                        Hotspot shape: <strong>{getValues("hotspotShape")}</strong>
                                                    </span>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="title" className="text-sm font-medium">Pin Title *</Label>
                                                    <Input
                                                        id="title"
                                                        {...register("title")}
                                                        className="bg-input border-border focus:ring-ring"
                                                        placeholder="Enter a title for pins in this hotspot"
                                                    />
                                                    {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
                                                </div>

                                                <div className="space-y-2 relative">
                                                    <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                                                    <Textarea
                                                        id="description"
                                                        {...register("description")}
                                                        className="bg-input border-border focus:ring-ring min-h-[100px] resize-none"
                                                        placeholder="Describe what makes this hotspot special..."
                                                    />
                                                    <EnhanceDescriptionButton className="absolute bottom-2 right-2" />
                                                    {errors.description && (
                                                        <p className="text-destructive text-sm">{errors.description.message}</p>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="pinType" className="text-sm font-medium">Pin Type</Label>
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
                                                        <Label htmlFor="url" className="text-sm font-medium">URL / Link</Label>
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

                                        {/* Right: Collection & Tier Settings only */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <Settings className="w-5 h-5 text-primary" />
                                                    Collection &amp; Tier Settings
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
                                    </div>

                                    {/* Advanced Settings */}
                                    <HotspotAdvancedSettings />
                                </div>
                            )}

                            {/* ── STEP 2: Preview ─────────────────────────────────────── */}
                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <CheckCircle className="w-5 h-5 text-primary" />
                                                Hotspot Preview
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {/* Image + title */}
                                                <div className="space-y-4">
                                                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                                                        {coverUrl ? (
                                                            <img
                                                                src={coverUrl}
                                                                alt="Hotspot preview"
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
                                                        <h2 className="text-xl font-bold text-foreground">
                                                            {getValues("title") || "Hotspot Title"}
                                                        </h2>
                                                        <p className="text-muted-foreground">{getValues("description")}</p>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge variant="outline">{getValues("type")}</Badge>
                                                            <Badge variant={collectionMode === "auto" ? "default" : "secondary"}>
                                                                {collectionMode === "auto" ? "Auto Collect" : "Manual Collect"}
                                                            </Badge>
                                                            <Badge variant="outline" className="flex items-center gap-1">
                                                                {shapeIcon}
                                                                {getValues("hotspotShape")}
                                                            </Badge>
                                                            {getValues("multiPin") && <Badge variant="outline">Multi-Pin</Badge>}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stats grid */}
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <PreviewStat label="Pins per Drop" value={getValues("pinNumber")} />
                                                        <PreviewStat label="Collection Limit" value={getValues("pinCollectionLimit") || "Unlimited"} />
                                                        <PreviewStat
                                                            label="Drop Frequency"
                                                            value={scheduleInterval}
                                                        />
                                                        <PreviewStat
                                                            label="Pin Duration"
                                                            value={`${getValues("pinDurationDays")} day${getValues("pinDurationDays") !== 1 ? "s" : ""}`}
                                                        />
                                                        <PreviewStat
                                                            label="Hotspot Start"
                                                            value={getValues("hotspotStartDate")
                                                                ? new Date(getValues("hotspotStartDate")).toLocaleDateString()
                                                                : "—"}
                                                        />
                                                        <PreviewStat
                                                            label="Hotspot End"
                                                            value={getValues("hotspotEndDate")
                                                                ? new Date(getValues("hotspotEndDate")).toLocaleDateString()
                                                                : "—"}
                                                        />
                                                        {totalEstimatedDrops !== null && (
                                                            <PreviewStat
                                                                label="Est. Total Drops"
                                                                value={totalEstimatedDrops}
                                                                className="col-span-2"
                                                            />
                                                        )}
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
                                                                    <span className="font-medium">{getValues("pinCollectionLimit") || "Unlimited"}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">Remaining Balance:</span>
                                                                    <span className={`font-medium ${remainingBalance < 0 ? "text-destructive" : "text-accent"}`}>
                                                                        {remainingBalance}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Schedule Summary Card in preview */}
                                    <Card className="border-primary/30 bg-primary/5">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-lg text-primary">
                                                <CalendarClock className="w-5 h-5 text-primary" />
                                                Schedule Summary
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                <div className="p-3 bg-background rounded-lg border border-primary/20">
                                                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> First Pin Drop
                                                    </div>
                                                    <div className="font-semibold text-sm">
                                                        {getValues("hotspotStartDate")
                                                            ? new Date(getValues("hotspotStartDate")).toLocaleDateString()
                                                            : "—"}
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-background rounded-lg border border-primary/20">
                                                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                        <Repeat className="w-3 h-3" /> Frequency
                                                    </div>
                                                    <div className="font-semibold text-sm">{scheduleInterval}</div>
                                                </div>
                                                <div className="p-3 bg-background rounded-lg border border-primary/20">
                                                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                        <Timer className="w-3 h-3" /> Pin Lifetime
                                                    </div>
                                                    <div className="font-semibold text-sm">
                                                        {getValues("pinDurationDays")} day{getValues("pinDurationDays") !== 1 ? "s" : ""}
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-background rounded-lg border border-primary/20">
                                                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                        <Zap className="w-3 h-3" /> Est. Total Drops
                                                    </div>
                                                    <div className="font-semibold text-sm">
                                                        {totalEstimatedDrops ?? "—"}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-3">
                                                Each pin{"'"}s start date = drop time · end date = drop time + {getValues("pinDurationDays")} day{getValues("pinDurationDays") !== 1 ? "s" : ""}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </form>
                    </FormProvider>
                </div>

                <DialogFooter className="flex justify-between items-center">
                    <Button type="button" variant="outline" onClick={handleClose} className="border-border">
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
                                Next: Preview <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={() => onSubmit(getValues())}
                                disabled={addHotspotM.isLoading || remainingBalance < 0}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                                {addHotspotM.isLoading && <Loader className="animate-spin mr-2 w-4 h-4" />}
                                {addHotspotM.isLoading ? "Creating Hotspot..." : "Create Hotspot"}
                            </Button>
                        )}
                    </div>
                </DialogFooter>

                {addHotspotM.isError && (
                    <div className="px-6 pb-2">
                        <p className="text-destructive text-sm">{addHotspotM.error.message}</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PreviewStat({
    label,
    value,
    className,
}: {
    label: string
    value: string | number | undefined
    className?: string
}) {
    return (
        <div className={`p-3 bg-muted rounded-lg ${className ?? ""}`}>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="font-medium">{value ?? "—"}</div>
        </div>
    )
}

function HotspotAdvancedSettings() {
    const { control } = useFormContext<CreateHotspotType>()
    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-2">
                <Settings className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm font-semibold text-gray-700">Advanced Settings</h4>
            </div>

            <Card className="border border-gray-200 hover:border-blue-300 transition-colors duration-200">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <Label htmlFor="multiPin" className="text-sm font-medium cursor-pointer text-gray-900">
                                Multi Pin
                            </Label>
                            <p className="text-xs text-gray-500 mt-1">
                                Allow multiple pins to be collected from this hotspot location
                            </p>
                        </div>
                        <Controller
                            name="multiPin"
                            control={control}
                            render={({ field }) => (
                                <Switch id="multiPin" checked={field.value} onCheckedChange={field.onChange} />
                            )}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function CollectionInputs({
    setSelectedToken,
    setRemainingBalance,
    assetsQuery,
    selectedToken,
    remainingBalance,
}: {
    setSelectedToken: (asset: (AssetType & { bal: number }) | undefined) => void
    setRemainingBalance: (balance: number) => void
    assetsQuery: {
        data?: {
            pageAsset?: { code: string; creatorId: string; issuer: string; thumbnail: string | null }
            shopAsset: AssetType[]
        }
    }
    selectedToken: (AssetType & { bal: number }) | undefined
    remainingBalance: number
}) {
    const { control, register, formState: { errors } } = useFormContext<CreateHotspotType>()
    const { getAssetBalance } = useCreatorStorageAcc()

    return (
        <div className="space-y-4">
            {/* Token selector */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Choose Token</Label>
                <Controller
                    name="token"
                    control={control}
                    render={({ field }) => (
                        <Select
                            onValueChange={(value) => {
                                const id = Number(value)
                                field.onChange(id === NO_ASSET ? undefined : id)

                                if (id === NO_ASSET) { setSelectedToken(undefined); setRemainingBalance(0); return }

                                if (id === PAGE_ASSET_NUM) {
                                    const pa = assetsQuery.data?.pageAsset
                                    if (pa) {
                                        const bal = getAssetBalance({ code: pa.code, issuer: pa.issuer })
                                        setSelectedToken({ bal, code: pa.code, issuer: pa.issuer, id: PAGE_ASSET_NUM, thumbnail: pa.thumbnail ?? "" })
                                        setRemainingBalance(bal)
                                    } else { toast.error("No page asset found") }
                                    return
                                }

                                const asset = assetsQuery.data?.shopAsset.find((a: AssetType) => a.id === id)
                                if (asset) {
                                    const bal = getAssetBalance({ code: asset.code, issuer: asset.issuer })
                                    setSelectedToken({ ...asset, bal })
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
                                    <SelectItem key={asset.id} value={asset.id.toString()}>{asset.code}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>

            {/* Pins per drop */}
            <div className="space-y-2">
                <Label htmlFor="pinNumber" className="text-sm font-medium">Pins per Drop</Label>
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

            {/* Collection limit */}
            <div className="space-y-2">
                <Label htmlFor="pinCollectionLimit" className="text-sm font-medium">Pin Collection Limit</Label>
                <Input
                    type="number"
                    id="pinCollectionLimit"
                    min={0}
                    {...register("pinCollectionLimit", { valueAsNumber: true })}
                    className="bg-input border-border focus:ring-ring"
                    placeholder="0 = unlimited"
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

function TiersOptions() {
    const tiersQuery = api.fan.member.getAllMembership.useQuery({})
    const { control } = useFormContext<CreateHotspotType>()
    if (tiersQuery.isLoading) return <div className="skeleton h-10 w-20" />
    if (tiersQuery.data) {
        return (
            <div className="space-y-2">
                <Label className="text-sm font-medium">Choose Tier</Label>
                <Controller
                    name="tier"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange}>
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
        )
    }
    return null
}

function ImageUploadField({ coverUrl, setCover, setValue }: {
    coverUrl: string | undefined
    setCover: (url: string | undefined) => void
    setValue: (name: "image", value: string | undefined) => void
}) {
    return (
        <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Pin Cover Image</Label>
            <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors duration-200">
                <CardContent className="p-6 text-center">
                    <UploadS3Button
                        endpoint="imageUploader"
                        className="w-full"
                        onClientUploadComplete={(res) => {
                            if (res?.url) { setCover(res.url); setValue("image", res.url) }
                        }}
                        onUploadError={(error: Error) => console.error(error.message)}
                    />
                    {coverUrl && (
                        <div className="mt-6 flex justify-center">
                            <div className="relative group">
                                <img
                                    className="rounded-xl shadow-lg transition-transform duration-200 group-hover:scale-105 border border-gray-200"
                                    width={200}
                                    height={200}
                                    alt="preview image"
                                    src={coverUrl}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function EnhanceDescriptionButton({ className }: { className?: string }) {
    const { watch, setValue } = useFormContext<CreateHotspotType>()
    const description = watch("description")
    const enhanceMutation = api.pinAgent.enhanceDescription.useMutation({
        onSuccess: (data) => { setValue("description", data.enhancedDescription); toast.success("Description enhanced!") },
        onError: (err) => toast.error(err.message || "Failed to enhance description"),
    })

    return (
        <Button
            type="button"
            size="sm"
            onClick={() => {
                if (!description?.trim()) { toast.error("Please enter a description first"); return }
                enhanceMutation.mutate({ description: description.trim() })
            }}
            disabled={!description || description.trim().length === 0 || enhanceMutation.isLoading}
            className={`${className} h-6 w-6 px-2 text-xs gap-1 hover:bg-primary/10 rounded-full`}
        >
            {enhanceMutation.isLoading
                ? <Loader className="w-3 h-3 animate-spin" />
                : <Wand2 className="w-3 h-3" />}
        </Button>
    )
}