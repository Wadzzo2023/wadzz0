"use client"

import type { Creator } from "@prisma/client"
import AssetView from "~/components/marketplace/asset/asset_view"
import NftCreate from "~/components/marketplace/nft_create"
import { MoreAssetsSkeleton } from "~/components/marketplace/platforms_nfts"
import { useModal } from "~/lib/state/play/use-modal-store"
import { api } from "~/utils/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/shadcn/ui/dialog"
import { z } from "zod"
import { type SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Label } from "~/components/shadcn/ui/label"
import { PLATFORM_ASSET } from "~/lib/stellar/constant"
import { Input } from "~/components/shadcn/ui/input"
import { Button } from "~/components/shadcn/ui/button"
import { Box, Calendar, ExternalLink, Loader2, Package, Plus, QrCode, Store, Trash2 } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"
import SellPageAssetList from "~/components/sell-page-asset-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/shadcn/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/shadcn/ui/card"
import { Skeleton } from "~/components/shadcn/ui/skeleton"
import { useSession } from "next-auth/react"
import { Badge } from "~/components/shadcn/ui/badge"
import { format } from "date-fns"
import { QRItem } from "~/types/qr"
import QRCodeModal from "~/components/modals/qr-code-modal"

export const updateAssetFormShema = z.object({
  price: z.number().nonnegative(),
  priceUSD: z.number().nonnegative(),
})

type pageAsset =
  | {
    price: number
    priceUSD: number
    code: string
    creatorId: string
    issuer: string
    thumbnail: string | null
  }
  | {
    code: string | undefined
    issuer: string | undefined
    creatorId: string
    price: number
    priceUSD: number
    thumbnail: string
  }
  | null
  | undefined

export default function Shop({ creator }: { creator?: Creator }) {
  const pageAsset = api.fan.creator.getCreatorPageAsset.useQuery()
  console.log(pageAsset.data)

  return (
    <div className="my-7">
      <div className="fixed z-10 bottom-10 right-0 p-4 lg:bottom-0 lg:right-80">
        <NftCreate />
      </div>

      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            All Shop Items
          </TabsTrigger>
          <TabsTrigger value="sell-assets" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Page asset
          </TabsTrigger>
          <TabsTrigger value="qr-assets" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            QR Items
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Marketplace Items</h2>
          </div>
          <AllShopItems pageAsset={pageAsset.data} />
        </TabsContent>

        <TabsContent value="sell-assets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Sell Orders</h2>
          </div>
          <SellPageAssetList />
        </TabsContent>
        <TabsContent value="qr-assets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">QR Items</h2>
          </div>
          <QRAssetList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
function QRAssetList() {
  const { data: session } = useSession()
  const [selectedQRItem, setSelectedQRItem] = useState<QRItem | null>(null)
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const qrItems = api.qr.getQRItems.useQuery(undefined, {
    enabled: !!session?.user?.id,
  })
  const deleteQRItem = api.qr.deleteQRItem.useMutation({
    onSuccess: () => {
      toast.success("QR item deleted successfully!")
      qrItems.refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
  const isItemActive = (item: QRItem) => {
    const now = new Date()
    return now >= new Date(item.startDate) && now <= new Date(item.endDate)
  }
  const handleViewQR = (item: QRItem) => {
    setSelectedQRItem(item)
    setIsQRModalOpen(true)
  }
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {qrItems.isLoading && (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {qrItems.data?.map((item) => (
          <Card key={item.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {/* Updated to work with descriptions array */}
                    {item.descriptions && item.descriptions.length > 0 ? (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {item.descriptions.sort((a, b) => a.order - b.order)[0]?.title}
                        </div>
                        <div>
                          {item.descriptions[0]?.content && item.descriptions[0].content.length > 100
                            ? `${item.descriptions[0].content.slice(0, 100)}...`
                            : item.descriptions[0]?.content}
                        </div>
                        {item.descriptions.length > 1 && (
                          <div className="text-xs text-muted-foreground">
                            +{item.descriptions.length - 1} more description
                            {item.descriptions.length > 2 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    ) : (
                      "No descriptions available"
                    )}
                  </CardDescription>
                </div>
                <Badge variant={isItemActive(item) ? "default" : "secondary"}>
                  {isItemActive(item) ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Item Details */}
              <div className="space-y-2 text-sm">
                {item.modelUrl && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Box className="h-4 w-4" />
                    <span>3D Model included</span>
                  </div>
                )}
                {item.externalLink && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ExternalLink className="h-4 w-4" />
                    <span>External link included</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(item.startDate), "MMM dd")} -{" "}
                    {format(new Date(item.endDate), "MMM dd, yyyy")}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => handleViewQR(item)} className="gap-1 flex-1">
                  <QrCode className="h-4 w-4" />
                  View QR
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this QR item?")) {
                      deleteQRItem.mutate({ id: item.id })
                    }
                  }}
                  disabled={deleteQRItem.isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {qrItems.data?.length === 0 && !qrItems.isLoading && (
          <div className="col-span-full">
            <Card className="p-12 text-center">
              <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No QR Items Yet</h3>
              <p className="text-muted-foreground mb-4">Create your first QR item to get started</p>

            </Card>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {selectedQRItem && (
        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => {
            setIsQRModalOpen(false)
            setSelectedQRItem(null)
          }}
          qrItem={selectedQRItem}
        />
      )}
    </>

  )
}

function AllShopItems({ pageAsset }: { pageAsset: pageAsset }) {
  const { onOpen } = useModal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof updateAssetFormShema>>({
    resolver: zodResolver(updateAssetFormShema),
    defaultValues: {
      price: pageAsset?.price,
      priceUSD: pageAsset?.priceUSD,
    },
  });

  console.log(pageAsset);
  const assets = api.marketplace.market.getACreatorNfts.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );


  const update = api.fan.creator.updatePageAssetPrice.useMutation({
    onSuccess: (data) => {
      if (data) {
        reset();
        toast.success("Page Asset Updated Successfully");
        setIsModalOpen(false);
      }
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof updateAssetFormShema>> = (
    data,
  ) => {
    update.mutate(data);
  };



  if (assets.isLoading)
    return (
      <MoreAssetsSkeleton className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5" />
    );


  if (assets.data) {
    return (
      <div className="p-2">


        <div
          style={{
            scrollbarGutter: "stable",
          }}
          className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        // className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5"
        >
          {
            pageAsset && (
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger>
                  <AssetView
                    code={pageAsset.code}
                    thumbnail={pageAsset.thumbnail ?? "https://app.wadzzo.com/images/loading.png"}
                  />
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium">
                        Price in {PLATFORM_ASSET.code}
                      </Label>
                      <Input
                        defaultValue={Number(pageAsset.price)}
                        id="price"
                        type="number"
                        step="0.01"
                        {...register("price", { valueAsNumber: true })}
                        className={`w-full ${errors.price ? "border-red-500" : ""}`}
                      />
                      {errors.price && (
                        <p className="text-sm text-red-500">{errors.price.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priceUSD" className="text-sm font-medium">
                        Price in USD
                      </Label>
                      <Input
                        id="priceUSD"
                        type="number"
                        defaultValue={Number(pageAsset.priceUSD)}
                        step="0.01"
                        {...register("priceUSD", { valueAsNumber: true })}
                        className={`w-full ${errors.priceUSD ? "border-red-500" : ""}`}
                      />
                      {errors.priceUSD && (
                        <p className="text-sm text-red-500">{errors.priceUSD.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full transform rounded-md bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-purple-600"
                      disabled={update.isLoading}
                    >
                      {update.isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Page Asset"
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )
          }



          {assets.data.pages.map((page) =>
            page.nfts.map((item, i) => (
              <div
                key={i}
                onClick={() =>
                  onOpen("creator asset info", { creatorStoreAsset: item })
                } // Pass the closeModal function
              >
                <AssetView
                  code={item.asset.name}
                  thumbnail={item.asset.thumbnail}
                />
              </div>
            )),
          )}
        </div>
        {assets.hasNextPage && (
          <button
            className="btn btn-outline btn-primary"
            onClick={() => void assets.fetchNextPage()}
          >
            Load More
          </button>
        )}
      </div>
    );
  }
}

// export interface ShopItemProps extends ShopAsset {
//   asset: {
//     code: string;
//     issuer: string;
//   };
// }

// export function ShopItem({ item }: { item: Asset }) {
//   const { data } = useSession();
//   if (data && item.creatorId)
//     return (
//       <div className="card w-96 bg-base-100 shadow-xl">
//         <div className="card-body">
//           <div className="flex justify-between">
//             <h2 className="card-title">{item.name}</h2>
//             <ShopItemContextMenu creatorId={item.creatorId} itemId={item.id} />
//           </div>
//           <p>{item.description}</p>
//           <div className="card-actions justify-end">
//             <button className="btn btn-outline btn-primary self-start">
//               {item.code}
//             </button>
//             {item.creatorId != data.user.id && <BuyItemModal item={item} />}
//           </div>
//         </div>
//       </div>
//       // <div className="card w-96 rounded-full bg-base-300">
//       //   <p>{item.name}</p>
//       //   <p>{item.price}</p>
//       // </div>
//     );
// }
// function ShopItemContextMenu({
//   creatorId,
//   itemId,
// }: {
//   creatorId: string;
//   itemId: number;
// }) {
//   const { data } = useSession();
//   // const deleteAsset = api.shop.deleteAsset.useMutation();

//   const handleDelete = () => console.log("deleted testing"); //deleteAsset.mutate(itemId);

//   if (data?.user && data.user.id === creatorId) {
//     return (
//       <ContextMenu
//         handleDelete={handleDelete}
//         isLoading={deleteAsset.isLoading}
//       />
//     );
//   }
// }
