"use client"

import { useState } from "react"
import { getCookie } from "cookies-next"
import { Button } from "~/components/shadcn/ui/button"
import { Card, CardContent, CardHeader } from "~/components/shadcn/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "~/components/shadcn/ui/dialog"
import { Badge } from "~/components/shadcn/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/shadcn/ui/avatar"
import { ShoppingCart, Coins, Star, Clock, User, X, Gem } from "lucide-react"
import { api } from "~/utils/api"
import toast from "react-hot-toast"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { PLATFORM_ASSET } from "~/lib/stellar/constant"
import { clientsign, WalletType } from "package/connect_wallet"
import { clientSelect } from "~/lib/stellar/fan/utils"
import { clsx } from "clsx"

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

  const [layoutMode] = useState<"modern" | "legacy">(() => {
    const cookieMode = getCookie("wadzzo-layout-mode");
    if (cookieMode === "modern") {
      return "modern";
    }
    if (cookieMode === "legacy") {
      return "legacy";
    }
    if (typeof window !== "undefined") {
      const storedMode = localStorage.getItem("layoutMode");
      if (storedMode === "modern") {
        return "modern";
      }
      if (storedMode === "legacy") {
        return "legacy";
      }
    }
    return "legacy";
  });

  const isModern = layoutMode === "modern";

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
    return isModern ? (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="animate-pulse rounded-[0.95rem] border border-[#ddd9d0]">
            <CardContent className="p-0">
              <div className="aspect-[0.96] bg-[#d8c7bb] rounded-t-[0.95rem]" />
              <div className="space-y-3 p-4">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    ) : (
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
      <div className={isModern ? "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4"}>
        {assets.map((asset) => (
          isModern ? (
            <Card
              key={asset.id}
              className="group h-full overflow-hidden rounded-[0.95rem] border border-[#ddd9d0] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] cursor-pointer"
              onClick={() => handleAssetClick(asset)}
            >
              <CardContent className="flex h-full flex-col p-0">
                <div className="relative aspect-[0.96] overflow-hidden rounded-t-[0.95rem] bg-[#d8c7bb]">
                  <Image
                    src={asset.placer?.profileUrl ?? "https://app.wadzzo.com/images/loading.png"}
                    alt={asset.title}
                    height={200}
                    width={200}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs bg-white/90 text-black/80 backdrop-blur-[4px]">
                      {asset.amountToSell} {asset.placer?.pageAsset?.code ? asset.placer.pageAsset.code : asset.placer?.customPageAssetCodeIssuer?.split(":")[0]}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 px-4 pb-3.5 pt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#f3f1ee] px-2 py-0.5 text-[0.64rem] font-medium text-black/60">
                      <Gem className="h-3 w-3" />
                      NFT
                    </span>
                  </div>
                  <h3 className="line-clamp-1 text-[0.98rem] font-semibold leading-tight text-black/90">
                    {asset.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {asset.placer?.name ?? "Anonymous"}
                  </p>
                  <div className="flex items-center gap-1 text-sm font-medium text-black/88">
                    <span className="text-[#1f86ee]">{asset.priceXLM} XLM</span>
                    <span className="text-black/55">{asset.price} WADZZO</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
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
                  {asset.description && <p className="text-xs text-muted-foreground line-clamp-1">{asset.description}</p>}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-green-600">{asset.priceXLM} XLM</p>
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
          )
        ))}
      </div>

      {/* Buy Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {isModern ? (
          <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden border-0 bg-[#fbfaf6] p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] [&>button]:hidden">
            <div className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden md:flex-row">
              <div className="flex-shrink-0 border-b border-black/8 bg-[#f1eee6] md:w-[42%] md:border-b-0 md:border-r">
                <div className="relative h-[320px] overflow-hidden bg-[#d8c7bb] md:h-full md:min-h-[720px]">
                  {selectedAsset && (
                    <Image
                      src={selectedAsset.placer?.profileUrl ?? "https://app.wadzzo.com/images/loading.png"}
                      alt={selectedAsset.title}
                      height={400}
                      width={400}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-1 flex-col overflow-y-auto bg-[#fbfaf6] md:w-[58%]">
                <div className="flex flex-1 flex-col space-y-6 overflow-y-auto p-5 md:p-8">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <h2 className="text-[1.65rem] font-semibold tracking-tight text-black">
                        {selectedAsset?.title}
                      </h2>
                      <p className="text-sm text-black/70">
                        by {selectedAsset?.placer?.name ?? "Anonymous"}
                      </p>
                    </div>
                    <DialogClose className="self-start md:inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/12 bg-transparent text-black/55 transition hover:bg-black/5 hover:text-black">
                      <X className="h-4 w-4" />
                    </DialogClose>
                  </div>
                  {selectedAsset?.description && (
                    <p className="text-sm text-black/70">{selectedAsset.description}</p>
                  )}
                  <div className="border-b border-black/10 pt-4">
                    <h3 className="inline-block border-b-2 border-black pb-3 text-sm font-medium tracking-tight text-black">
                      Purchase Details
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <span className="text-sm text-black/55">Available</span>
                      <span className="text-sm font-medium text-black">
                        {selectedAsset?.amountToSell} {selectedAsset?.placer?.pageAsset?.code}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <span className="text-sm text-black/55">Price (WADZZO)</span>
                      <span className="text-sm font-medium text-[#1f86ee]">{selectedAsset?.price} WADZZO</span>
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <span className="text-sm text-black/55">Price (XLM)</span>
                      <span className="text-sm font-medium text-black">{selectedAsset?.priceXLM} XLM</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-black/8 bg-white p-4 md:p-6">
                  <div className="space-y-3">
                    <Button
                      onClick={handleBuyWithWadzzo}
                      disabled={buyLoading !== null || !session.data?.user}
                      className="h-12 w-full rounded-xl bg-[#1f86ee] text-base font-semibold text-white hover:bg-[#1877da]"
                    >
                      Buy with WADZZO
                    </Button>
                    {selectedAsset && selectedAsset.priceXLM > 0 && (
                      <Button
                        onClick={handleBuyWithXLM}
                        disabled={buyLoading !== null || !session.data?.user}
                        variant="outline"
                        className="h-12 w-full rounded-xl border-2"
                      >
                        Buy with XLM
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        ) : (
          <DialogContent className="w-[90vw] max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Purchase Asset
              </DialogTitle>
            </DialogHeader>

            {selectedAsset && (
              <div className="space-y-6">
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
                <div className="space-y-3">
                  <h4 className="font-medium">Choose Payment Method</h4>
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
        )}
      </Dialog >
    </>
  )
}
