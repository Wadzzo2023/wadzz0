"use client"

import type React from "react"
import { useState, useMemo } from "react"
import {
    BarChart3,
    CalendarDays,
    ChevronDown,
    Download,
    Filter,
    Loader2,
    MapPin,
    Users,
    X,
    ArrowUpRight,
    ArrowDownRight,
    ArrowLeft,
} from "lucide-react"
import Link from "next/link"

import { api } from "~/utils/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/shadcn/ui/table"
import { Button } from "~/components/shadcn/ui/button"
import { type CreatorConsumedPin, useModal } from "~/lib/state/play/use-modal-store"
import { addrShort } from "~/utils/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/shadcn/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/shadcn/ui/dropdown-menu"
import { Badge } from "~/components/shadcn/ui/badge"
import { Input } from "~/components/shadcn/ui/input"
import { Skeleton } from "~/components/shadcn/ui/skeleton"
import { cn } from "~/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/shadcn/ui/tabs"
import { Checkbox } from "~/components/shadcn/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "~/components/shadcn/ui/dialog"
import { Label } from "~/components/shadcn/ui/label"
import { ScrollArea } from "~/components/shadcn/ui/scroll-area"
// Add these imports at the top with the other imports
import { Calendar } from "~/components/shadcn/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/shadcn/ui/popover"
import { format } from "date-fns"

type ConsumerType = {
    user: {
        name: string | null
        id: string
        email: string | null
    }
    claimed_at: Date | null
}

const CreatorCollectionReport = () => {
    const [selectedDays, setSelectedDays] = useState<number | undefined>(undefined)
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState("overview")

    const pins = api.maps.pin.getCreatorPinTConsumedByUser.useQuery(selectedDays ? { day: selectedDays } : undefined, {
        enabled: true,
    })

    // Calculate summary metrics
    const metrics = useMemo(() => {
        if (!pins.data) return null

        const totalPins = pins.data.length
        const totalLocations = pins.data.reduce((acc, pin) => acc + pin.locations.length, 0)

        const totalConsumers = pins.data.reduce((acc, pin) => {
            return acc + pin.locations.reduce((locAcc, loc) => locAcc + loc.consumers.length, 0)
        }, 0)

        const consumptionRate = totalLocations > 0 ? Math.round((totalConsumers / totalLocations) * 100) : 0

        // Calculate top pins by consumer count
        const topPins = [...pins.data]
            .map((pin) => {
                const consumerCount = pin.locations.reduce((acc, loc) => acc + loc.consumers.length, 0)
                return { id: pin.id, title: pin.title, consumerCount }
            })
            .sort((a, b) => b.consumerCount - a.consumerCount)
            .slice(0, 5)

        return {
            totalPins,
            totalLocations,
            totalConsumers,
            consumptionRate,
            topPins,
        }
    }, [pins.data])

    if (pins.isLoading) {
        return <LoadingState />
    }

    if (!pins.data) {
        return <EmptyState message="No data available" />
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild className="mb-4">
                    <Link href="/fan/creator" className="flex items-center">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Creator Dashboard
                    </Link>
                </Button>
            </div>

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Collection Reports</h1>
                    <p className="text-muted-foreground">Monitor and analyze your pin collection performance</p>
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9">
                                <CalendarDays className="mr-2 h-4 w-4" />
                                {selectedDays ? `Last ${selectedDays} days` : "All time"}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => setSelectedDays(undefined)}>All time</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedDays(7)}>Last 7 days</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedDays(15)}>Last 15 days</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedDays(30)}>Last 30 days</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedDays(90)}>Last 90 days</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <ReportDownloadItem day={7}>Last 7 days (Weekly)</ReportDownloadItem>
                            <ReportDownloadItem day={30}>Last 30 days (Monthly)</ReportDownloadItem>
                            <ReportDownloadItem day={90}>Last 90 days (Quarterly)</ReportDownloadItem>
                            <ReportDownloadItem day={365}>Last 365 days (Yearly)</ReportDownloadItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {selectedDays && (
                <div className="mb-6">
                    <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>Filtered to last {selectedDays} days</span>
                        <X
                            className="ml-1 h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                            onClick={() => setSelectedDays(undefined)}
                        />
                    </Badge>
                </div>
            )}

            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="data">Data Table</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {metrics && (
                        <>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                <MetricCard title="Total Pins" value={metrics.totalPins} icon={<MapPin className="h-4 w-4" />} />
                                <MetricCard
                                    title="Total Locations"
                                    value={metrics.totalLocations}
                                    icon={<MapPin className="h-4 w-4" />}
                                />
                                <MetricCard
                                    title="Total Consumers"
                                    value={metrics.totalConsumers}
                                    icon={<Users className="h-4 w-4" />}
                                />
                                <MetricCard
                                    title="Consumption Rate"
                                    value={`${metrics.consumptionRate}%`}
                                    icon={<BarChart3 className="h-4 w-4" />}
                                />
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg font-medium">Top Performing Pins</CardTitle>
                                        <CardDescription>Pins with the highest consumer engagement</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {metrics.topPins.map((pin, index) => (
                                                <div key={pin.id} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{pin.title}</div>
                                                            <div className="text-xs text-muted-foreground">{pin.id}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary">{pin.consumerCount} consumers</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0">
                                        <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab("data")}>
                                            View all pins
                                        </Button>
                                    </CardFooter>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
                                        <CardDescription>Latest consumer interactions</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {pins.data
                                                .slice(0, 5)
                                                .flatMap((pin) =>
                                                    pin.locations.flatMap((location) =>
                                                        location.consumers.slice(0, 1).map((consumer) => (
                                                            <div
                                                                key={`${pin.id}-${location.id}-${consumer.user.id}`}
                                                                className="flex items-center justify-between"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                                                        {consumer.user.name?.[0] ?? "U"}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium">{consumer.user.email ?? "Anonymous User"}</div>
                                                                        <div className="text-xs text-muted-foreground">Collected from {pin.title}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {consumer.claimedAt
                                                                        ? new Date(consumer.claimedAt).toLocaleDateString()
                                                                        : "Unknown date"}
                                                                </div>
                                                            </div>
                                                        )),
                                                    ),
                                                )
                                                .slice(0, 5)}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0">
                                        <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab("data")}>
                                            View all activity
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="data">
                    <Card className="border-none shadow-sm">
                        <CardContent className="p-0 pt-6">
                            <TableData
                                pins={pins.data}
                                selectedDays={selectedDays}
                                setSelectedDays={setSelectedDays}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                isLoading={pins.isLoading}
                                isRefetching={pins.isRefetching}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default CreatorCollectionReport

function MetricCard({
    title,
    value,
    icon,
    trend,
}: {
    title: string
    value: string | number
    icon: React.ReactNode
    trend?: { value: number; label: string }
}) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">{icon}</div>
                </div>
                <div className="mt-4">
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm font-medium text-muted-foreground">{title}</div>
                </div>
                {trend && (
                    <div className="mt-2 flex items-center text-xs">
                        {trend.value > 0 ? (
                            <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                        ) : (
                            <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                        )}
                        <span className={trend.value > 0 ? "text-green-500" : "text-red-500"}>
                            {trend.value > 0 ? "+" : ""}
                            {trend.value}%
                        </span>
                        <span className="ml-1 text-muted-foreground">{trend.label}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Replace the TableData function with this enhanced version that includes comprehensive filtering
export function TableData({
    pins,
    selectedDays,
    setSelectedDays,
    searchTerm,
    setSearchTerm,
    isLoading,
    isRefetching,
}: {
    pins: CreatorConsumedPin[]
    selectedDays: number | undefined
    setSelectedDays: (days: number | undefined) => void
    searchTerm: string
    setSearchTerm: (term: string) => void
    isLoading: boolean
    isRefetching: boolean
}) {
    const { onOpen } = useModal()

    // Add these types and state at the beginning of the TableData function
    type SortField = "title" | "startDate" | "consumers" | "id"
    type SortDirection = "asc" | "desc"
    const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({
        field: "startDate",
        direction: "desc",
    })

    // Add filter states
    const [filters, setFilters] = useState({
        title: "",
        pinId: "",
        location: "",
        startDate: null as Date | null,
        endDate: null as Date | null,
    })
    const [showFilters, setShowFilters] = useState(false)

    // Add this function to handle sorting
    const handleSort = (field: SortField) => {
        setSortConfig((prevConfig) => ({
            field,
            direction: prevConfig.field === field && prevConfig.direction === "asc" ? "desc" : "asc",
        }))
    }

    // Add this function to handle filter changes
    const handleFilterChange = (field: keyof typeof filters, value: string | Date | null) => {
        setFilters((prev) => ({ ...prev, [field]: value }))
    }

    // Add this function to reset filters
    const resetFilters = () => {
        setFilters({
            title: "",
            pinId: "",
            location: "",
            startDate: null,
            endDate: null,
        })
        setSearchTerm("")
    }

    // Add this function to get the sorted and filtered data
    const getFilteredAndSortedPins = (pins: CreatorConsumedPin[]) => {
        // First apply filters
        const filteredData = pins.filter((pin) => {
            // Search term filter (existing)
            const matchesSearch =
                searchTerm === ""
                ||
                pin.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pin.id.toLowerCase().includes(searchTerm.toLowerCase())

            // Title filter
            const matchesTitle = filters.title === "" || pin.title.toLowerCase().includes(filters.title.toLowerCase())

            // Pin ID filter
            const matchesPinId = filters.pinId === "" || pin.id.toLowerCase().includes(filters.pinId.toLowerCase())

            // Location filter (check if any location matches)
            const matchesLocation =
                filters.location === "" ||
                pin.locations.some((loc) => {
                    const locationString = `${loc.latitude.toFixed(6)},${loc.longitude.toFixed(6)}`.toLowerCase()
                    return locationString.includes(filters.location.toLowerCase())
                })

            // Date range filter
            const pinStartDate = new Date(pin.startDate)
            const matchesStartDate = !filters.startDate || pinStartDate >= filters.startDate
            const matchesEndDate = !filters.endDate || pinStartDate <= filters.endDate

            return matchesSearch && matchesTitle && matchesPinId && matchesLocation && matchesStartDate && matchesEndDate
        })

        // Then sort the filtered data
        return [...filteredData].sort((a, b) => {
            switch (sortConfig.field) {
                case "title":
                    return sortConfig.direction === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
                case "startDate":
                    return sortConfig.direction === "asc"
                        ? new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                        : new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
                case "consumers":
                    const aConsumers = a.locations.reduce((sum, loc) => sum + loc.consumers.length, 0)
                    const bConsumers = b.locations.reduce((sum, loc) => sum + loc.consumers.length, 0)
                    return sortConfig.direction === "asc" ? aConsumers - bConsumers : bConsumers - aConsumers
                case "id":
                    return sortConfig.direction === "asc" ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id)
                default:
                    return 0
            }
        })
    }

    // Replace the existing filteredPins definition with this:
    const filteredPins = getFilteredAndSortedPins(pins)

    // Check if any filters are active
    const hasActiveFilters =
        searchTerm !== "" ||
        filters.title !== "" ||
        filters.pinId !== "" ||
        filters.location !== "" ||
        filters.startDate !== null ||
        filters.endDate !== null

    if (filteredPins.length === 0 && !isLoading) {
        return (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Filter className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No results found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    {hasActiveFilters ? "Try adjusting your filters" : "No pins match the current filter criteria"}
                </p>
                {hasActiveFilters && (
                    <Button variant="outline" className="mt-4" onClick={resetFilters}>
                        Reset all filters
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div>
            <div className="mb-6 flex flex-col gap-4 px-6 md:flex-row md:items-center md:justify-between">
                <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input
                        placeholder="Search pins by title or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9"
                    />
                    {searchTerm && (
                        <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")} className="h-9 px-2">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex flex-col space-y-1">
                        <Label>Date Range</Label>
                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 justify-start text-left font-normal">
                                        {filters.startDate ? (
                                            format(filters.startDate, "PPP")
                                        ) : (
                                            <span className="text-muted-foreground">From date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={filters.startDate ?? undefined}
                                        onSelect={(date) => handleFilterChange("startDate", date ?? null)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 justify-start text-left font-normal">
                                        {filters.endDate ? (
                                            format(filters.endDate, "PPP")
                                        ) : (
                                            <span className="text-muted-foreground">To date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={filters.endDate ?? undefined}
                                        onSelect={(date) => {
                                            // Set the time to the end of the day for the end date
                                            if (date) {
                                                const endOfDay = new Date(date)
                                                endOfDay.setHours(23, 59, 59, 999)
                                                handleFilterChange("endDate", endOfDay)
                                            } else {
                                                handleFilterChange("endDate", null)
                                            }
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={resetFilters}>
                            <X className="mr-2 h-4 w-4" />
                            Clear Filters
                        </Button>
                    )}
                </div>
            </div>


            {hasActiveFilters && (
                <div className="mt-2 rounded-md bg-muted p-2 text-xs">
                    <div className="font-semibold">Active Filters:</div>

                    <div>Start Date: {filters.startDate ? format(filters.startDate, "PPP") : "None"}</div>
                    <div>End Date: {filters.endDate ? format(filters.endDate, "PPP") : "None"}</div>
                    <div>Search Term: {searchTerm ?? "None"}</div>
                </div>
            )}

            <div className="relative overflow-hidden rounded-md border">
                {isRefetching && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                )}

                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[180px] cursor-pointer" onClick={() => handleSort("id")}>
                                <div className="flex items-center">
                                    Location Group ID
                                    {sortConfig.field === "id" && (
                                        <ChevronDown
                                            className={`ml-1 h-4 w-4 transition-transform ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
                                        />
                                    )}
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                                <div className="flex items-center">
                                    Title
                                    {sortConfig.field === "title" && (
                                        <ChevronDown
                                            className={`ml-1 h-4 w-4 transition-transform ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
                                        />
                                    )}
                                </div>
                            </TableHead>
                            <TableHead className="w-[180px]">Location (Lat | Lng)</TableHead>
                            <TableHead className="w-[140px] cursor-pointer" onClick={() => handleSort("consumers")}>
                                <div className="flex items-center">
                                    Consumer ID
                                    {sortConfig.field === "consumers" && (
                                        <ChevronDown
                                            className={`ml-1 h-4 w-4 transition-transform ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
                                        />
                                    )}
                                </div>
                            </TableHead>
                            <TableHead className="w-[180px]">Email</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPins.flatMap((pin) =>
                            pin.locations.flatMap((location) =>
                                location.consumers.length > 0 ? (
                                    location.consumers.map((consumer, consumerIndex) => (
                                        <TableRow
                                            key={`${pin.id}-${location.id}-${consumer.user.id}-${consumerIndex}`}
                                            className={cn(
                                                "transition-colors hover:bg-muted/50",
                                                consumerIndex % 2 === 0 ? "bg-background" : "bg-muted/10",
                                            )}
                                        >
                                            {consumerIndex === 0 ? (
                                                <>
                                                    <TableCell className="font-medium" rowSpan={location._count.consumers}>
                                                        <div className="flex items-center">
                                                            <span className="font-mono text-xs text-muted-foreground">{pin.id}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell rowSpan={location._count.consumers}>
                                                        <div className="font-medium">{pin.title}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Created: {new Date(pin.startDate).toLocaleDateString()}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium" rowSpan={location._count.consumers}>
                                                        <div className="font-mono text-xs">
                                                            {location.latitude.toFixed(6)} | {location.longitude.toFixed(6)}
                                                        </div>
                                                    </TableCell>
                                                </>
                                            ) : null}
                                            <TableCell>
                                                <div className="font-mono text-xs">{addrShort(consumer.user.id, 5)}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[150px] truncate text-sm">
                                                    {consumer.user.email ?? <span className="text-muted-foreground">Stellar Loggedin</span>}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow key={`${pin.id}-${location.id}-no-consumers`} className="hover:bg-muted/50">
                                        <TableCell>
                                            <div className="font-mono text-xs text-muted-foreground">{pin.id}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{pin.title}</div>
                                            <div className="text-xs text-muted-foreground">
                                                Created: {new Date(pin.startDate).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-mono text-xs">
                                                {location.latitude.toFixed(6)} | {location.longitude.toFixed(6)}
                                            </div>
                                        </TableCell>
                                        <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                                            No consumers for this location
                                        </TableCell>
                                    </TableRow>
                                ),
                            ),
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-2 px-6 text-xs text-muted-foreground">
                Showing {filteredPins.length} items
                {selectedDays ? ` (filtered to last ${selectedDays} days)` : ""}
                {sortConfig &&
                    ` • Sorted by ${sortConfig.field} (${sortConfig.direction === "asc" ? "ascending" : "descending"})`}
                {hasActiveFilters && " • Filters applied"}
            </div>
        </div>
    )
}

function ReportDownloadItem({
    day,
    children,
}: {
    day: number
    children?: React.ReactNode
}) {
    const [showFieldSelector, setShowFieldSelector] = useState(false)
    const download = api.maps.pin.downloadCreatorPinTConsumedByUser.useMutation({
        onSuccess: (data) => {
            DownloadPinLocationAsCSV(data, selectedFields)
        },
    })

    // Define all available fields
    const allFields = [
        { id: "creatorId", label: "Creator ID" },
        { id: "pin_title", label: "Pin Title" },
        { id: "pin_id", label: "Pin ID" },
        { id: "start_date", label: "Start Date" },
        { id: "end_date", label: "End Date" },
        { id: "location_id", label: "Location ID" },
        { id: "latitude", label: "Latitude" },
        { id: "longitude", label: "Longitude" },
        { id: "auto_collect", label: "Auto Collect" },
        { id: "consumer_name", label: "Consumer Name" },
        { id: "consumer_email", label: "Consumer Email" },
        { id: "consumer_id", label: "Consumer ID" },
        { id: "claimed_at", label: "Claimed At" },
    ]

    // State to track selected fields
    const [selectedFields, setSelectedFields] = useState<string[]>(allFields.map((field) => field.id))

    // Toggle field selection
    const toggleField = (fieldId: string) => {
        setSelectedFields((prev) => (prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]))
    }

    // Select all fields
    const selectAllFields = () => {
        setSelectedFields(allFields.map((field) => field.id))
    }

    // Deselect all fields
    const deselectAllFields = () => {
        setSelectedFields([])
    }

    return (
        <>
            <DropdownMenuItem
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowFieldSelector(true)
                }}
            >
                <div className="flex w-full items-center">
                    <Download className="mr-2 h-3.5 w-3.5" />
                    {children}
                </div>
            </DropdownMenuItem>

            <Dialog
                open={showFieldSelector}
                onOpenChange={(open) => {
                    // Only allow the dialog to be closed via the buttons
                    if (!open) {
                        setShowFieldSelector(false)
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Export Options</DialogTitle>
                        <DialogDescription>Select the fields you want to include in your export for {children}</DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-between py-2">
                        <Button variant="outline" size="sm" onClick={selectAllFields}>
                            Select All
                        </Button>
                        <Button variant="outline" size="sm" onClick={deselectAllFields}>
                            Deselect All
                        </Button>
                    </div>

                    <ScrollArea className="h-[300px] pr-4">
                        <div className="grid gap-4">
                            {allFields.map((field) => (
                                <div key={field.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`field-${field.id}`}
                                        checked={selectedFields.includes(field.id)}
                                        onCheckedChange={() => toggleField(field.id)}
                                    />
                                    <Label htmlFor={`field-${field.id}`} className="flex-1 cursor-pointer">
                                        {field.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    <DialogFooter className="flex justify-between sm:justify-between">
                        <Button
                            variant="outline"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setShowFieldSelector(false)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (selectedFields.length === 0) {
                                    alert("Please select at least one field to export")
                                    return
                                }
                                download.mutate({ day: day })
                                setShowFieldSelector(false)
                            }}
                            disabled={download.isLoading ?? selectedFields.length === 0}
                        >
                            {download.isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                "Export"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

function DownloadPinLocationAsCSV(data: CreatorConsumedPin[], selectedFields: string[] = []) {
    // Skip if no data
    if (!data.length) {
        alert("No data available to download")
        return
    }

    // Skip if no fields selected
    if (selectedFields.length === 0) {
        alert("Please select at least one field to export")
        return
    }

    // Define proper types for the accessor functions
    type LocationType = {
        id: string
        latitude: number
        longitude: number
        autoCollect: boolean
        _count: { consumers: number }
        consumers: ConsumerType[]
    }

    // Define all possible fields and their accessor functions with proper typing
    const fieldAccessors: Record<
        string,
        (pin: CreatorConsumedPin, location: LocationType, consumer: ConsumerType) => string | number | boolean
    > = {
        creatorId: (pin) => pin.creatorId,
        pin_title: (pin) => pin.title,
        pin_id: (pin) => pin.id,
        start_date: (pin) => new Date(pin.startDate).toISOString(),
        end_date: (pin) => new Date(pin.endDate).toISOString(),
        location_id: (_, location) => location.id,
        latitude: (_, location) => location.latitude,
        longitude: (_, location) => location.longitude,
        auto_collect: (_, location) => location.autoCollect,
        consumer_name: (_, __, consumer) => consumer.user.name ?? "N/A",
        consumer_email: (_, __, consumer) => consumer.user.email ?? "",
        consumer_id: (_, __, consumer) => consumer.user.id,
        claimed_at: (_, __, consumer) => (consumer.claimed_at ? new Date(consumer.claimed_at).toISOString() : ""),
    }

    // Create CSV content with only selected fields
    const csvContent = [
        // Headers row with only selected fields
        selectedFields,

        // Data rows with only selected fields
        ...data.flatMap((pin) =>
            pin.locations.flatMap((location) =>
                (location.consumers ?? []).map((consumer: ConsumerType) =>
                    selectedFields.map((field) => fieldAccessors[field] ? fieldAccessors[field](pin, location, consumer) : ""),
                ),
            ),
        ),
    ]
        .map((e) => e.join(",")) // Convert each row into a comma-separated string
        .join("\n") // Combine all rows with newline characters

    // Create a Blob from the CSV data
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

    // Create a link element and trigger a download
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `pin_locations_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up
    URL.revokeObjectURL(url)
}

function LoadingState() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Collection Reports</h1>
                    <p className="text-muted-foreground">Monitor and analyze your pin collection performance</p>
                </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                    <Skeleton className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="mt-2 h-4 w-32" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Filter className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{message}</h3>
            <p className="mt-2 text-sm text-muted-foreground">There is no data available for the selected period.</p>
        </div>
    )
}
