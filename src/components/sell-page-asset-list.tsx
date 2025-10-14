"use client"

import { useState } from "react"
import { Button } from "~/components/shadcn/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/shadcn/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/shadcn/ui/dialog"
import { Badge } from "~/components/shadcn/ui/badge"
import { Eye, Edit, Trash2, DollarSign, Package } from 'lucide-react'
import { api } from "~/utils/api"
import toast from "react-hot-toast"
import SellPageAssetUpdate from "./sell-page-asset-update"
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
import { PLATFORM_ASSET } from "~/lib/stellar/constant"

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
            <div className="flex justify-center items-center p-8">
                <span className="loading loading-spinner mr-2"></span>
                Loading your assets...
            </div>
        )
    }

    if (!assets || assets.length === 0) {
        return (
            <div className="text-center p-8">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No assets found</h3>
                <p className="text-sm text-muted-foreground">You haven{"'"}t created any sell page assets yet.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Badge variant="secondary">{assets.length} assets</Badge>
            </div>

            <div className="grid gap-4">
                {assets.map((asset) => (
                    <Card key={asset.id} className={`${asset.isSold ? 'opacity-60' : ''}`}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {asset.title}
                                        {asset.isSold && <Badge variant="secondary">Sold</Badge>}
                                    </CardTitle>
                                    {asset.description && (
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                            {asset.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleView(asset)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    {!asset.isSold && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(asset)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
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
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Amount</p>
                                    <p className="font-medium">{asset.amountToSell} units</p>
                                </div>
                                <div>
                                    <h3 className="font-medium text-sm text-muted-foreground"> Price in {PLATFORM_ASSET.code}</h3>
                                    <p className="font-medium">{asset.price}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">USD Price</p>
                                    <p className="font-medium">${asset.priceUSD}</p>
                                </div>

                            </div>
                            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                                <p>Created: {formatDate(asset.placedAt)}</p>
                                {asset.isSold && asset.soldAt && (
                                    <p>Sold: {formatDate(asset.soldAt)}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Asset Details
                        </DialogTitle>
                    </DialogHeader>
                    {selectedAsset && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-medium text-sm text-muted-foreground">Title</h3>
                                        <p className="text-lg font-medium">{selectedAsset.title}</p>
                                    </div>
                                    {selectedAsset.description && (
                                        <div>
                                            <h3 className="font-medium text-sm text-muted-foreground">Description</h3>
                                            <p className="text-sm">{selectedAsset.description}</p>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
                                        <Badge variant={selectedAsset.isSold ? "secondary" : "default"}>
                                            {selectedAsset.isSold ? "Sold" : "Available"}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-medium text-sm text-muted-foreground">Amount to Sell</h3>
                                        <p className="text-lg font-medium">{selectedAsset.amountToSell} units</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h3 className="font-medium text-sm text-muted-foreground"> Price in {PLATFORM_ASSET.code}</h3>
                                            <p className="font-medium">{selectedAsset.price}</p>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-sm text-muted-foreground">USD Price</h3>
                                            <p className="font-medium">${selectedAsset.priceUSD}</p>
                                        </div>
                                    </div>
                                    {selectedAsset.priceXLM > 0 && (
                                        <div>
                                            <h3 className="font-medium text-sm text-muted-foreground">XLM Price</h3>
                                            <p className="font-medium">{selectedAsset.priceXLM} XLM</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <h3 className="font-medium text-muted-foreground">Total Platform Value</h3>
                                        <p className="text-lg font-bold">{selectedAsset.price * selectedAsset.amountToSell}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-muted-foreground">Total USD Value</h3>
                                        <p className="text-lg font-bold">${(selectedAsset.priceUSD * selectedAsset.amountToSell).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="border-t pt-4 text-xs text-muted-foreground">
                                <p>Created: {formatDate(selectedAsset.placedAt)}</p>
                                {selectedAsset.isSold && selectedAsset.soldAt && (
                                    <p>Sold: {formatDate(selectedAsset.soldAt)}</p>
                                )}
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
                        <SellPageAssetUpdate
                            asset={selectedAsset}
                            onClose={() => {
                                setIsUpdateDialogOpen(false)
                                setSelectedAsset(null)
                                refetch()
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
