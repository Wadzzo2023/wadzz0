import { CreatorAvater } from "~/pages/search";
import { api } from "~/utils/api";

import { Profile } from "./profile-menu";
import { Button } from "~/components/shadcn/ui/button";
import Link from "next/link";
import { CREATOR_PLURAL_TERM } from "~/utils/term";

export function UserMode() {
  return (
    <div className="flex h-full flex-1 flex-col gap-2 overflow-auto rounded-lg  bg-base-200/50 p-2">
      <Profile />
      <AllCreators />
      {/* <BottonNav /> */}
    </div>
  );
}

export function AllCreators() {
  const creators = api.fan.creator.getAllCreator.useInfiniteQuery(
    { limit: 4 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  return (
    <div className="flex w-full  flex-1 flex-col  items-start gap-2 overflow-y-auto rounded-lg border-4 border-base-100  pt-5">
      <p className="pl-2 text-lg font-bold">All {CREATOR_PLURAL_TERM}</p>
      <div className="w-full flex-1 overflow-auto rounded-lg  p-2 scrollbar-hide ">
        <ul className=" ">
          {creators.data?.pages.map((page) => {
            return page.items.map((creator) => {
              return (
                <div
                  className="mb-1 border-b-2 border-black border-opacity-10"
                  key={creator.id}
                >
                  <li>
                    <CreatorAvater creator={creator} />
                  </li>
                </div>
              );
            });
          })}
        </ul>

        {creators.hasNextPage && (
          <button onClick={() => void creators.fetchNextPage()} className="btn">
            {creators.isFetching && (
              <span className="loading loading-spinner"></span>
            )}
            See more
          </button>
        )}
      </div>
    </div>
  );
}

function BottonNav() {
  return (
    <div className="flex flex-col gap-1">
      <Button variant="default">
        <Link href="/fans/notifications"> Notification</Link>
      </Button>
    </div>
  );
}

// function PopularItems() {
//   const assets = api.shop.getAllPopularAsset.useInfiniteQuery(
//     { limit: 4 },
//     {
//       getNextPageParam: (lastPage) => lastPage.nextCursor,
//     },
//   );
//   return (
//     <div className="flex w-full  flex-1 flex-col   items-start gap-4 overflow-y-auto rounded-lg border-4 border-base-100 p-2 pt-5">
//       <p className="text-lg font-bold ">Popular Assets</p>
//       <ul className="w-full flex-1 overflow-auto rounded-lg bg-base-300 p-2 scrollbar-hide">
//         {assets.data?.pages.map((page) => {
//           return page.items.map((asset) => {
//             return (
//               <li key={asset.id} className="">
//                 <AssetItem shopItem={asset} />

//                 {/* <CreatorAvater creator={creator} /> */}
//               </li>
//             );
//           });
//         })}
//         {assets.hasNextPage && (
//           <button onClick={() => void assets.fetchNextPage()} className="btn">
//             {assets.isFetching && (
//               <span className="loading loading-spinner"></span>
//             )}
//             See more
//           </button>
//         )}
//       </ul>
//     </div>
//   );
// }

// export function AssetItem({
//   shopItem,
// }: {
//   shopItem: ShopAsset & { asset: { code: string; issuer: string } };
// }) {
//   return (
//     <div className="flex  items-center justify-between  p-2 hover:rounded-lg hover:bg-base-100">
//       <div className="flex gap-4">
//         <div className="avatar">
//           <div className="mask mask-hexagon w-10">
//             <Image alt="Nft image" fill src={validUrl(shopItem.thumbnail)} />
//           </div>
//         </div>
//         <div>
//           <p className="font-bold">{shopItem.name}</p>
//           <p>Price: {shopItem.price}</p>
//         </div>
//       </div>
//       <div className="items-end self-end">
//         <BuyItemModal btnClassName="btn-sm btn-secondary" item={shopItem} />
//       </div>
//     </div>
//   );
// }

// function validUrl(input: string | null) {
//   if (input) {
//     if (isValidUrl(input)) {
//       return input;
//     }
//   }

//   return "/images/nft.png";
// }
