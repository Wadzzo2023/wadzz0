import { useRouter } from "next/router";
import React from "react";
import { CreatorAvater } from "~/pages/search";
import { api } from "~/utils/api";

import Button from "./ui/button";
import Link from "next/link";
import { Search } from "lucide-react";
import BuyItemModal from "./fan/shop/buy-item-modal";
import { ShopAsset } from "@prisma/client";
import Image from "next/image";
import { isValidUrl } from "~/utils/string";
import Right from "./wallete/right";

export default function RightBar() {
  const router = useRouter();
  if (router.pathname == "/")
    return (
      <div className="hidden h-full w-80  flex-col bg-base-100/80  lg:flex">
        <Right />
        {/* <div className="my-2 flex w-full flex-row justify-center gap-1 px-4 ">
          <Link href={"/search"} className="w-full" key={"Search"}>
            <button className="btn w-full shadow-md shadow-gray-300">
              <Search />
              SEARCH
            </button>
          </Link>
        </div>
        <div className="m-2 flex flex-1 flex-col gap-2 overflow-auto  rounded-lg  bg-base-200 p-2">
          <AllCreators />
          <PopularItems />
        </div> */}
      </div>
    );
}
function AllCreators() {
  const creators = api.creator.getAllCreator.useInfiniteQuery(
    { limit: 4 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  return (
    <div className="flex w-full  flex-1 flex-col   items-start gap-4 overflow-y-auto rounded-lg border-4 border-base-100 p-2 pt-5">
      <p className=" text-lg font-bold">All creators</p>
      <div className="w-full flex-1 overflow-auto rounded-lg bg-base-300 p-2 scrollbar-hide">
        <ul className="">
          {creators.data?.pages.map((page) => {
            return page.items.map((creator) => {
              return (
                <li key={creator.id}>
                  <CreatorAvater creator={creator} />
                </li>
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

function PopularItems() {
  const assets = api.shop.getAllPopularAsset.useInfiniteQuery(
    { limit: 4 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );
  return (
    <div className="flex w-full  flex-1 flex-col   items-start gap-4 overflow-y-auto rounded-lg border-4 border-base-100 p-2 pt-5">
      <p className="text-lg font-bold ">Popular Assets</p>
      <ul className="w-full flex-1 overflow-auto rounded-lg bg-base-300 p-2 scrollbar-hide">
        {assets.data?.pages.map((page) => {
          return page.items.map((asset) => {
            return (
              <li key={asset.id} className="">
                <AssetItem shopItem={asset} />

                {/* <CreatorAvater creator={creator} /> */}
              </li>
            );
          });
        })}
        {assets.hasNextPage && (
          <button onClick={() => void assets.fetchNextPage()} className="btn">
            {assets.isFetching && (
              <span className="loading loading-spinner"></span>
            )}
            See more
          </button>
        )}
      </ul>
    </div>
  );
}

export function AssetItem({
  shopItem,
}: {
  shopItem: ShopAsset & { asset: { code: string; issuer: string } };
}) {
  return (
    <div className="flex  items-center justify-between  p-2 hover:rounded-lg hover:bg-base-100">
      <div className="flex gap-4">
        <div className="avatar">
          <div className="mask mask-hexagon w-10">
            <Image alt="Nft image" fill src={validUrl(shopItem.thumbnail)} />
          </div>
        </div>
        <div>
          <p className="font-bold">{shopItem.name}</p>
          <p>Price: {shopItem.price}</p>
        </div>
      </div>
      <div className="items-end self-end">
        <BuyItemModal btnClassName="btn-sm btn-secondary" item={shopItem} />
      </div>
    </div>
  );
}

function validUrl(input: string | null) {
  if (input) {
    if (isValidUrl(input)) {
      return input;
    }
  }

  return "/images/nft.png";
}
