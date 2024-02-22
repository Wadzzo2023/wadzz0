import { useRouter } from "next/router";
import React from "react";
import { CreatorAvater } from "~/pages/search";
import { api } from "~/utils/api";

import Button from "./ui/button";
import Link from "next/link";
import { Search } from "lucide-react";

export default function RightBar() {
  const router = useRouter();
  if (router.pathname == "/")
    return (
      <div className="hidden h-full w-80  flex-col bg-base-100/80  lg:flex">
        <div className="flex px-4 my-2 w-full flex-row justify-center gap-1 ">
          <Link href={"/search"} className="w-full" key={"Search"}>
          <button className="btn w-full shadow-md shadow-gray-300">
            <Search/>
            SEARCH
          </button>
          </Link>
          </div>
        <div className="m-2 flex flex-1 flex-col gap-2 overflow-auto  rounded-lg  bg-base-200 p-2">
          <AllCreators />
          <PopularItems />
        </div>
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
                <AssetItem name={asset.name} price={asset.price} />
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

function AssetItem({ name, price }: { name: string; price: number }) {
  return (
    <div className="flex  items-center gap-2 p-2 hover:rounded-lg hover:bg-base-100">
      <div className="avatar">
        <div className="mask mask-hexagon w-10">
          <img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
        </div>
      </div>
      <div>
        <p className="font-bold">{name}</p>
        <p>Price: {price}</p>
      </div>
    </div>
  );
}
