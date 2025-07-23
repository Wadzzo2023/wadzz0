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
import { Loader2, Package, Store } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"
import SellPageAssetList from "~/components/sell-page-asset-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/shadcn/ui/tabs"

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
      <div className="fixed bottom-10 right-0 p-4 lg:bottom-0 lg:right-80">
        <NftCreate />
      </div>

      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            All Shop Items
          </TabsTrigger>
          <TabsTrigger value="sell-assets" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Sell Page Assets
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
            <h2 className="text-2xl font-bold">My Sell Page Assets</h2>
          </div>
          <SellPageAssetList />
        </TabsContent>
      </Tabs>
    </div>
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
