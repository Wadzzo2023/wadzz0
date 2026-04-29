"use client"

import { useState } from "react"
import { Button } from "~/components/shadcn/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/shadcn/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/shadcn/ui/dialog"
import { Badge } from "~/components/shadcn/ui/badge"
import { Eye, Edit, Trash2, DollarSign, Package, CheckCircle2, Clock, MoreHorizontal, TrendingUp, Calendar } from 'lucide-react'
import { api } from "~/utils/api"
import toast from "react-hot-toast"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "~/components/shadcn/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/shadcn/ui/dropdown-menu"
import { PLATFORM_ASSET } from "~/lib/stellar/constant"
import SellPageAssetUpdate from "./sell-page-asset-update"
import { Skeleton } from "./shadcn/ui/skeleton"
import { Separator } from "./shadcn/ui/separator"

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

export default function SellPageAssetList() {
    const [selectedAsset, setSelectedAsset] = useState<SellPageAsset | null>(null)
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

    const { data: assets, isLoading, refetch } = api.fan.asset.getMyAssets.useQuery()

    const deleteAsset = api.fan.asset.deleteSoldPageAsset.useMutation({
        onSuccess: () => {
            toast.success("Asset deleted successfully")
            refetch()
        },
        onError: (error) => {
            toast.error(`Failed to delete asset: ${error.message}`)
        },
    })

    const handleDelete = (assetId: number) => {
        deleteAsset.mutate({ id: assetId })
    }

    const handleEdit = (asset: SellPageAsset) => {
        setSelectedAsset(asset)
        setIsUpdateDialogOpen(true)
    }

    const handleView = (asset: SellPageAsset) => {
        setSelectedAsset(asset)
        setIsViewDialogOpen(true)
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-24" />
                </div>
                <div className="grid gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-6 w-3/4" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                    <Skeleton className="h-8 w-8 ml-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (!assets || assets.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                    <Package className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No assets found</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    You haven{"'"}t created any sell page assets yet. Create your first asset to get started.
                </p>
                <Button>
                    <Package className="h-4 w-4 mr-2" />
                    Create Asset
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="px-3 py-1">
                        {assets.length} {assets.length === 1 ? "asset" : "assets"}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1">
                        {assets.filter((a) => !a.isSold).length} available
                    </Badge>
                </div>
            </div>

            {/* Asset Grid */}
            <div className="grid gap-6">
                {assets.map((asset) => (
                    <Card
                        key={asset.id}
                        className={`overflow-hidden transition-all hover:shadow-md ${asset.isSold ? "bg-muted/30" : "bg-background"
                            }`}
                    >
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <CardTitle className="text-xl font-semibold">{asset.title}</CardTitle>
                                        <Badge
                                            variant={asset.isSold ? "secondary" : "default"}
                                            className={asset.isSold ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}
                                        >
                                            {asset.isSold ? (
                                                <>
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    Sold
                                                </>
                                            ) : (
                                                <>
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Available
                                                </>
                                            )}
                                        </Badge>
                                    </div>
                                    {asset.description && (
                                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{asset.description}</p>
                                    )}
                                </div>

                                {/* Actions */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="ml-4">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => handleView(asset)}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Details
                                        </DropdownMenuItem>
                                        {!asset.isSold && (
                                            <>
                                                <DropdownMenuItem onClick={() => handleEdit(asset)}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit Asset
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem
                                                            onSelect={(e) => e.preventDefault()}
                                                            className="text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete Asset
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete {asset.title}? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(asset.id)}
                                                                className="bg-red-600 hover:bg-red-700"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Pricing Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium text-muted-foreground">Amount</span>
                                    </div>
                                    <p className="text-lg font-semibold">{asset.amountToSell.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">units</p>
                                </div>

                                <div className="bg-muted/50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium text-muted-foreground">Unit Price</span>
                                    </div>
                                    <p className="text-lg font-semibold">{asset.priceUSD}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {asset.price} {PLATFORM_ASSET.code}
                                    </p>
                                </div>


                                <div className="bg-muted/50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium text-muted-foreground">
                                            {asset.isSold ? "Sold Date" : "Created"}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {formatDate(asset.isSold && asset.soldAt ? asset.soldAt : asset.placedAt)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Eye className="h-5 w-5" />
                            Asset Details
                        </DialogTitle>
                    </DialogHeader>
                    {selectedAsset && (
                        <div className="space-y-6">
                            {/* Header Info */}
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">{selectedAsset.title}</h2>
                                    <Badge
                                        variant={selectedAsset.isSold ? "secondary" : "default"}
                                        className={`${selectedAsset.isSold ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"} px-3 py-1`}
                                    >
                                        {selectedAsset.isSold ? (
                                            <>
                                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                                Sold
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="h-4 w-4 mr-1" />
                                                Available
                                            </>
                                        )}
                                    </Badge>
                                </div>
                            </div>

                            {selectedAsset.description && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Description</h3>
                                    <p className="text-muted-foreground leading-relaxed">{selectedAsset.description}</p>
                                </div>
                            )}

                            <Separator />

                            {/* Pricing Details */}
                            <div>
                                <h3 className="font-semibold text-lg mb-4">Pricing Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Package className="h-5 w-5 text-blue-600" />
                                                <span className="font-medium">Amount</span>
                                            </div>
                                            <p className="text-2xl font-bold">{selectedAsset.amountToSell.toLocaleString()}</p>
                                            <p className="text-sm text-muted-foreground">units available</p>
                                        </CardContent>
                                    </Card>



                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-medium">Unit Price ({PLATFORM_ASSET.code})</span>
                                            </div>
                                            <p className="text-2xl font-bold">{selectedAsset.price}</p>
                                            <p className="text-sm text-muted-foreground">per unit</p>
                                        </CardContent>
                                    </Card>

                                    {selectedAsset.priceXLM > 0 && (
                                        <Card>
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-medium">Unit Price (XLM)</span>
                                                </div>
                                                <p className="text-2xl font-bold">{selectedAsset.priceXLM}</p>
                                                <p className="text-sm text-muted-foreground">per unit</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>

                            <Separator />


                            <Separator />

                            {/* Timeline */}
                            <div>
                                <h3 className="font-semibold text-lg mb-4">Timeline</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                        <Calendar className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">Created</p>
                                            <p className="text-sm text-muted-foreground">{formatDate(selectedAsset.placedAt)}</p>
                                        </div>
                                    </div>
                                    {selectedAsset.isSold && selectedAsset.soldAt && (
                                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            <div>
                                                <p className="font-medium text-green-800">Sold</p>
                                                <p className="text-sm text-green-600">{formatDate(selectedAsset.soldAt)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Update Dialog */}
            <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5" />
                            Update Asset
                        </DialogTitle>
                    </DialogHeader>
                    {selectedAsset && (
                        <div className="p-4">
                            <SellPageAssetUpdate
                                asset={selectedAsset}
                                onClose={() => {
                                    setIsUpdateDialogOpen(false)
                                    setSelectedAsset(null)
                                    refetch()
                                }}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
