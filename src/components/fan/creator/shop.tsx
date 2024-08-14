import { Asset, Creator } from "@prisma/client";
import React from "react";
import AddItem2Shop from "./add-shop-item";
import { api } from "~/utils/api";
import BuyItemModal from "../shop/buy-item-modal";
import { useSession } from "next-auth/react";
import ContextMenu from "../../ui/context-menu";
import NftCreate from "~/components/marketplace/nft_create";
import MarketAssetComponent from "~/components/marketplace/market_asset";
import ViewMediaModal from "../shop/asset_view_modal";
import ShopAssetComponent from "../shop/shop_asset";
import { MoreAssetsSkeleton } from "~/components/marketplace/platforms_nfts";

export default function Shop({ creator }: { creator?: Creator }) {
  return (
    <div className="my-7">
      <div className="fixed bottom-10 right-0 p-4 lg:bottom-0 lg:right-80">
        <NftCreate />
      </div>
      <AllShopItems />
    </div>
  );
}

function AllShopItems() {
  const assets = api.marketplace.market.getACreatorNfts.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  // const toggleVisibility =
  //   api.marketplace.market.toggleVisibilityMarketNft.useMutation();

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
          className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5"
        >
          {assets.data.pages.map((page) =>
            page.nfts.map((item, i) => (
              <ViewMediaModal
                key={i}
                item={item}
                content={<ShopAssetComponent key={i} item={item} />}
              />
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
