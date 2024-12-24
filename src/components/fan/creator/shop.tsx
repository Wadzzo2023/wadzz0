import { Creator } from "@prisma/client";
import NftCreate from "~/components/marketplace/nft_create";
import { MoreAssetsSkeleton } from "~/components/marketplace/platforms_nfts";
import { api } from "~/utils/api";
import ViewMediaModal from "../shop/asset_view_modal";
import ShopAssetComponent from "../shop/shop_asset";
import AssetView from "~/components/marketplace/asset/asset_view";
import { useModal } from "~/lib/state/play/use-modal-store";
import RedeeemPage from "~/components/redeem/creator-redeem";

export default function Shop({ creator }: { creator?: Creator }) {
  return (
    <div className="my-7">
      <div className="fixed bottom-10 right-0 p-4 lg:bottom-0 lg:right-80">
        <NftCreate />
      </div>
      <div className="fixed bottom-24 right-0 p-4 lg:bottom-0 lg:right-[26rem]">
        <RedeeemPage />
      </div>
      <AllShopItems />
    </div>
  );
}

function AllShopItems() {
  const { onOpen } = useModal();
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
              <button
                key={i}
                onClick={() => onOpen("creator asset info", { creatorStoreAsset: item })} // Pass the closeModal function
                className="btn relative h-fit w-full overflow-hidden  py-4 ">
                <AssetView code={item.asset.name} thumbnail={item.asset.thumbnail} />
              </button>
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
