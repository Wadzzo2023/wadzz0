"use client"

import React, { useState, useEffect, useCallback } from "react"
import toast from "react-hot-toast"
import { Button } from "~/components/shadcn/ui/button"
import { api } from "~/utils/api"

import { addrShort } from "~/utils/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "~/components/shadcn/ui/dialog"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/shadcn/ui/card"
import { AlertCircle, Loader2, RefreshCw, Search, Sparkles, Trash, UserX, MoreHorizontal, Eye } from "lucide-react"
import { Input } from "~/components/shadcn/ui/input"
import { Badge } from "~/components/shadcn/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/shadcn/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/shadcn/ui/select"
import { Skeleton } from "~/components/shadcn/ui/skeleton"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/shadcn/ui/dropdown-menu"
import { Asset, MarketAsset } from "@prisma/client"

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            when: "beforeChildren",
            staggerChildren: 0.1,
            duration: 0.3,
        },
    },
}

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 300, damping: 24 },
    },
}

const tableRowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.05,
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1],
        },
    }),
    exit: { opacity: 0, x: -10, transition: { duration: 0.2 } },
}

const pulseAnimation = {
    scale: [1, 1.02, 1],
    transition: { duration: 2, repeat: Number.POSITIVE_INFINITY },
}

export type AssetType = Omit<Asset, "issuerPrivate">;

export type MarketAssetType = MarketAsset & {
    asset: AssetType
};

export default function MarketAssetAdmin() {
    const [isLoaded, setIsLoaded] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "name">("newest")
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [allAssets, setAllAssets] = useState<MarketAssetType[]>([])
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [assetToDelete, setAssetToDelete] = useState<MarketAssetType | null>(null)

    const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
        api.marketplace.market.getAllAssets.useInfiniteQuery(
            {
                limit: 20,
                search: searchTerm,
                sortBy: sortOrder,
            },
            {
                getNextPageParam: (lastPage) => lastPage.nextCursor,
                refetchOnWindowFocus: false,
            },
        )

    const deleteMutation = api.marketplace.market.deleteMarketAssetById.useMutation({
        onSuccess: () => {
            toast.success("Asset deleted successfully")
            setDeleteDialogOpen(false)
            setAssetToDelete(null)
            utils.marketplace.market.getAllAssets.invalidate()
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete asset")
        },
    })

    const utils = api.useUtils()

    useEffect(() => {
        if (data?.pages) {
            const flattenedAssets = data.pages.flatMap((page) => page.assets)
            setAllAssets(flattenedAssets)
            setHasMore(!!data.pages[data.pages.length - 1]?.nextCursor)
        }
    }, [data])

    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
                handleLoadMore()
            }
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [handleLoadMore])

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1)
            utils.marketplace.market.getAllAssets.invalidate()
        }, 500)

        return () => clearTimeout(timer)
    }, [searchTerm, sortOrder, utils])

    useEffect(() => {
        // Simulate loading for animation purposes
        const timer = setTimeout(() => setIsLoaded(true), 300)
        return () => clearTimeout(timer)
    }, [])

    const handleRefresh = () => {
        utils.marketplace.market.getAllAssets.invalidate()
    }

    const handleDeleteClick = (asset: MarketAssetType) => {
        setAssetToDelete(asset)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = () => {
        if (assetToDelete) {
            const code = assetToDelete.asset.code
            const issuer = assetToDelete.asset.issuer
            if (code && issuer) {
                deleteMutation.mutate({
                    marketId: assetToDelete.id
                })
            }
        }
    }

    const filteredAndSortedAssets = React.useMemo(() => {
        let filtered = allAssets

        if (searchTerm) {
            filtered = filtered.filter(
                (item) =>
                    item.asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.asset.creatorId?.toLowerCase().includes(searchTerm.toLowerCase()),
            )
        }

        return filtered.sort((a, b) => {
            switch (sortOrder) {
                case "newest":
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                case "oldest":
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                case "name":
                    return a.asset.name.localeCompare(b.asset.name)
                default:
                    return 0
            }
        })
    }, [allAssets, searchTerm, sortOrder])

    return (

        <motion.div initial="hidden" animate={isLoaded ? "visible" : "hidden"} variants={containerVariants} className="">
            <motion.div variants={itemVariants}>
                <Card className="overflow-hidden border shadow-md bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 " />
                            Market Assets Management
                        </CardTitle>
                        <CardDescription>Manage and organize your market assets</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search assets..."
                                        className="pl-9 bg-background/50"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <Select
                                        value={sortOrder}
                                        onValueChange={(value) => setSortOrder(value as "newest" | "oldest" | "name")}
                                    >
                                        <SelectTrigger className="w-full md:w-[180px] bg-background/50">
                                            <SelectValue placeholder="Sort by" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">Newest First</SelectItem>
                                            <SelectItem value="oldest">Oldest First</SelectItem>
                                            <SelectItem value="name">Name (A-Z)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {isLoading && page === 1 ? (
                                <LoadingState />
                            ) : error ? (
                                <ErrorState onRetry={handleRefresh} />
                            ) : filteredAndSortedAssets.length === 0 ? (
                                <EmptyState searchTerm={searchTerm} />
                            ) : (
                                <div className="rounded-md border bg-background/50 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                                    <TableHead className="w-12">#</TableHead>
                                                    <TableHead>Thumbnail</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Asset Code</TableHead>
                                                    <TableHead>Asset Issuer</TableHead>
                                                    <TableHead>PlacerID</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                <AnimatePresence initial={false}>
                                                    {filteredAndSortedAssets.map((item, index) => (
                                                        <motion.tr
                                                            key={item.id}
                                                            custom={index}
                                                            variants={tableRowVariants}
                                                            initial="hidden"
                                                            animate="visible"
                                                            exit="exit"
                                                            className="hover:bg-muted/50 transition-colors"
                                                        >
                                                            <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                                                            <TableCell>
                                                                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                                                                    {item.asset.thumbnail ? (
                                                                        <img
                                                                            src={item.asset.thumbnail || "/placeholder.svg"}
                                                                            alt={item.asset.name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="font-medium">{item.asset.name}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="secondary" className="font-mono text-xs">
                                                                    {item.asset.code}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="font-mono text-sm text-muted-foreground">
                                                                {addrShort(item.asset.issuer)}
                                                            </TableCell>
                                                            <TableCell className="font-mono text-sm text-muted-foreground">
                                                                {addrShort(item.placerId ?? "")}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {/* <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem>
                                                                                <Eye className="mr-2 h-4 w-4" />
                                                                                View Details
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                className="text-destructive"
                                                                                onClick={() => handleDeleteClick(asset)}
                                                                            >
                                                                                <Trash className="mr-2 h-4 w-4" />
                                                                                Delete
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu> */}
                                                                <Button
                                                                    className="text-destructive"
                                                                    onClick={() => handleDeleteClick(item)}
                                                                >
                                                                    <Trash className="mr-2 h-4 w-4" />
                                                                    Disable
                                                                </Button>

                                                            </TableCell>
                                                        </motion.tr>
                                                    ))}
                                                </AnimatePresence>
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {isFetchingNextPage && (
                                        <div className="flex justify-center py-4">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading more assets...
                                            </div>
                                        </div>
                                    )}

                                    {hasNextPage && !isFetchingNextPage && (
                                        <div className="flex justify-center py-4">
                                            <Button variant="outline" onClick={handleLoadMore} className="bg-background/50">
                                                Load More Assets
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Disable Asset</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-muted-foreground">
                            Are you sure you want to disable {assetToDelete?.asset.name}? This action cannot be undone.
                        </p>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isLoading}>
                            {deleteMutation.isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Disabling...
                                </>
                            ) : (
                                <>
                                    <Trash className="mr-2 h-4 w-4" />
                                    Disable
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>

    )
}

function LoadingState() {
    return (
        <div className="rounded-md border bg-background/50 p-8">
            <div className="flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center gap-4"
                >
                    <motion.div
                        animate={{
                            rotate: 360,
                            transition: { duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                        }}
                    >
                        <Loader2 className="h-10 w-10 " />
                    </motion.div>
                    <p className="text-muted-foreground">Loading assets...</p>

                    <div className="w-full max-w-md space-y-3 mt-4">
                        {[1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-4"
                            >
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[250px]" />
                                    <Skeleton className="h-4 w-[200px]" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="rounded-md border bg-red-50 border-red-200 p-8 flex flex-col items-center justify-center"
        >
            <div className="flex flex-col items-center gap-4 max-w-md text-center">
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="bg-red-100 p-3 rounded-full"
                >
                    <AlertCircle className="h-8 w-8 text-red-600" />
                </motion.div>
                <h3 className="text-lg font-semibold text-red-800">Failed to load assets</h3>
                <p className="text-red-700">
                    There was an error loading the asset data. Please try again or contact support if the problem persists.
                </p>
                <Button
                    variant="outline"
                    onClick={onRetry}
                    className="mt-2 border-red-300 text-red-700 hover:bg-red-100 bg-transparent"
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                </Button>
            </div>
        </motion.div>
    )
}

function EmptyState({ searchTerm }: { searchTerm: string }) {
    let message = "No market assets found"
    let description = "There are no market assets in the system yet."

    if (searchTerm) {
        message = "No matching market assets"
        description = `No market assets found matching "${searchTerm}".`
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="rounded-md border bg-background/50 p-12 flex flex-col items-center justify-center text-center"
        >
            <div className="flex flex-col items-center gap-4 max-w-md">
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="bg-muted/50 p-4 rounded-full"
                >
                    <UserX className="h-8 w-8 text-muted-foreground" />
                </motion.div>
                <h3 className="text-lg font-semibold">{message}</h3>
                <p className="text-muted-foreground">{description}</p>
                {searchTerm && (
                    <Button variant="outline" onClick={() => window.location.reload()} className="mt-2">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset Filters
                    </Button>
                )}
            </div>
        </motion.div>
    )
}
