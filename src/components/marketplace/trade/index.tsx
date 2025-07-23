"use client"

import { useState } from "react"
import { Button } from "~/components/shadcn/ui/button"
import { Card, CardContent, CardHeader } from "~/components/shadcn/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/shadcn/ui/dialog"
import { Badge } from "~/components/shadcn/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/shadcn/ui/avatar"
import { ShoppingCart, Coins, Star, Clock, User } from "lucide-react"
import { api } from "~/utils/api"
import toast from "react-hot-toast"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { PLATFORM_ASSET } from "~/lib/stellar/constant"
import { get } from "http"
import { clientsign, WalletType } from "package/connect_wallet"
import { clientSelect } from "~/lib/stellar/fan/utils"

interface PageAssetWithCreator {
  id: number
  title: string
  description: string | null
  amountToSell: number
  price: number
  priceUSD: number
  priceXLM: number
  isSold: boolean
  placedAt: Date
  placer: {
    name: string;
    id: string;
    profileUrl: string | null;
    customPageAssetCodeIssuer: string | null;
    pageAsset: {
      code: string;
      issuer: string;
      thumbnail: string | null;
    } | null;
  } | null;
}
export default function MarketPageAsset() {
  const [selectedAsset, setSelectedAsset] = useState<PageAssetWithCreator | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [buyLoading, setBuyLoading] = useState<"wadzzo" | "xlm" | null>(null)
  const session = useSession()

  const { data: assets, isLoading, refetch } = api.fan.asset.getAllAvailable.useQuery()
  console.log("session.data?.user?.walletType", session.data?.user?.walletType)
  const GetXDR = api.fan.asset.getXDR.useMutation({
    onSuccess: async (data, variables) => {
      if (data) {
        const { xdr } = data
        try {
          setBuyLoading(variables.paymentOption)
          const clientResponse = await clientsign({
            presignedxdr: xdr,
            walletType: session.data?.user?.walletType,
            pubkey: session.data?.user?.id,
            test: clientSelect(),

          })

          if (clientResponse) {
            if (variables.paymentOption === "wadzzo") {
              buyWithWadzzo.mutate({ assetId: variables.assetId })
            } else {
              buyWithXLM.mutate({ assetId: variables.assetId })
            }

            setBuyLoading(null)
          } else {
            setBuyLoading(null)

            toast.error("Error in signing transaction")

          }

        } catch (error) {
          setBuyLoading(null)
          console.error("Error ", error)

        }
      }
    },
    onError: (error) => {
      toast.error(`Error retrieving XDR: ${error.message}`)
    },
  })

  const buyWithWadzzo = api.fan.asset.buyWithWadzzo.useMutation({
    onSuccess: () => {
      toast.success("Purchase successful with Wadzzo!")
      setIsModalOpen(false)
      refetch()
    },
    onError: (error) => {
      toast.error(`Purchase failed: ${error.message}`)
    },
    onSettled: () => {
      setBuyLoading(null)
    },
  })

  const buyWithXLM = api.fan.asset.buyWithXLM.useMutation({
    onSuccess: () => {
      toast.success("Purchase successful with XLM!")
      setIsModalOpen(false)
      refetch()
    },
    onError: (error) => {
      toast.error(`Purchase failed: ${error.message}`)
    },
    onSettled: () => {
      setBuyLoading(null)
    },
  })

  const handleAssetClick = (asset: PageAssetWithCreator) => {
    setSelectedAsset(asset)
    setIsModalOpen(true)
  }

  const handleBuyWithWadzzo = () => {
    if (!selectedAsset) return
    setBuyLoading("wadzzo")
    GetXDR.mutate({ assetId: selectedAsset.id, paymentOption: "wadzzo" })

  }

  const handleBuyWithXLM = () => {
    if (!selectedAsset) return
    setBuyLoading("xlm")
    GetXDR.mutate({ assetId: selectedAsset.id, paymentOption: "xlm" })

  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!assets || assets.length === 0) {
    return (
      <div className="text-center p-12">
        <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium text-muted-foreground mb-2">No assets available</h3>
        <p className="text-sm text-muted-foreground">Check back later for new listings!</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
        {assets.map((asset) => (
          <Card
            key={asset.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group"
            onClick={() => handleAssetClick(asset)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={asset.placer?.profileUrl ?? ""} alt={asset.placer?.name ?? "Creator"} />
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {asset.placer?.name ?? "Anonymous"}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {asset.amountToSell} {' '}
                  {asset.placer?.pageAsset?.code ? asset.placer.pageAsset.code : asset.placer?.customPageAssetCodeIssuer?.split(":")[0]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Placeholder image - replace with actual asset image if available */}
              <div className="text-center">
                <Image
                  src={asset.placer?.profileUrl ?? "https://app.wadzzo.com/images/loading.png"}
                  alt={asset.title}
                  height={150}
                  width={150}
                  className="w-full h-full object-cover rounded-lg aspect-square"
                />

              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {asset.title}
                </h3>
                {asset.description && <p className="text-xs text-muted-foreground line-clamp-2">{asset.description}</p>}

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-green-600">${asset.priceUSD}</p>
                    <p className="text-xs text-muted-foreground">{asset.price} WADZZO</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDate(asset.placedAt)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Buy Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className=" w-[90vw] max-w-xl ">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Purchase Asset
            </DialogTitle>
          </DialogHeader>

          {selectedAsset && (
            <div className="space-y-6">
              {/* Asset Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedAsset.placer?.profileUrl ?? ""} alt={selectedAsset.placer?.name ?? "Creator"} />
                    <AvatarFallback>
                      <User className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedAsset.placer?.name ?? "Anonymous"}</p>
                    <p className="text-sm text-muted-foreground">Creator</p>
                  </div>
                </div>




                <div>
                  <h3 className="text-lg font-semibold mb-2">{selectedAsset.title}</h3>
                  {selectedAsset.description && (
                    <p className="text-sm text-muted-foreground mb-3">{selectedAsset.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Available</p>
                      <p className="font-medium">{selectedAsset.amountToSell} {
                        selectedAsset.placer?.pageAsset?.code ? selectedAsset.placer.pageAsset.code :
                          selectedAsset.placer?.customPageAssetCodeIssuer?.split(":")[0]
                      }</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Listed</p>
                      <p className="font-medium">{formatDate(selectedAsset.placedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Options */}
              <div className="space-y-3">
                <h4 className="font-medium">Choose Payment Method</h4>

                {/* Buy with Wadzzo */}
                <Button
                  onClick={handleBuyWithWadzzo}
                  disabled={buyLoading !== null || !session.data?.user}
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  {buyLoading === "wadzzo" ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-medium">Buy with {PLATFORM_ASSET.code}</p>
                        <p className="text-xs opacity-90">{selectedAsset.price} {PLATFORM_ASSET.code} </p>
                      </div>
                    </div>
                  )}
                </Button>

                {/* Buy with XLM */}
                {selectedAsset.priceXLM > 0 && (
                  <Button
                    onClick={handleBuyWithXLM}
                    disabled={buyLoading !== null || !session.data?.user}
                    variant="outline"
                    className="w-full h-12 border-2 hover:bg-gray-50 bg-transparent"
                  >
                    {buyLoading === "xlm" ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5" />
                        <div className="text-left">
                          <p className="font-medium">Buy with XLM</p>
                          <p className="text-xs text-muted-foreground">{selectedAsset.priceXLM} XLM</p>
                        </div>
                      </div>
                    )}
                  </Button>
                )}

              </div>

              {!session.data?.user && (
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-700">Please log in to purchase this asset</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog >
    </>
  )
}
