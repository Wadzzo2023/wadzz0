import { Creator } from "@prisma/client";
import clsx from "clsx";
import Link from "next/link";
import React, { useState } from "react";
import Avater from "~/components/ui/avater";
import { SearchMenu, useSearchMenu } from "~/lib/state/fan/search-menu";
import { api } from "~/utils/api";
import { truncateString } from "~/utils/string";

export default function Search() {
  const [inputText, setinpuText] = useState("");
  const { setSearchString } = useSearchMenu();

  return (
    <div className="my-10 mb-20 flex flex-col items-center gap-4">
      <h2 className="text mb-5 text-2xl font-bold"></h2>
      <div className="flex gap-2">
        <input
          type="text"
          className="input input-bordered w-full max-w-xs"
          onChange={(e) => setinpuText(e.currentTarget.value)}
        />
        <button className="btn" onClick={() => setSearchString(inputText)}>
          Search
        </button>
      </div>
      <Tabs />
      <ConditionallyRenderSearch />
    </div>
  );
}

function Tabs() {
  const { selectedMenu, setSelectedMenu } = useSearchMenu();
  return (
    <div role="tablist" className="tabs-boxed tabs">
      {Object.values(SearchMenu).map((key) => {
        return (
          <a
            key={key}
            onClick={() => setSelectedMenu(key)}
            role="tab"
            className={clsx(
              "tab",
              selectedMenu == key && "tab-active text-primary",
              "font-bold",
            )}
          >
            {key}
          </a>
        );
      })}
    </div>
  );
}

function ConditionallyRenderSearch() {
  const { selectedMenu } = useSearchMenu();
  return (
    <div className="w-full">
      {selectedMenu === SearchMenu.Post && <Posts />}
      {selectedMenu === SearchMenu.Creator && <Creators />}
      {/* {selectedMenu === SearchMenu.Asset && <AssetsList />} */}
    </div>
  );
}

function Posts() {
  const { searchString } = useSearchMenu();
  const posts = api.fan.post.search.useInfiniteQuery(
    { searchInput: searchString, limit: 5 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );
  return (
    <div className="flex flex-col items-center">
      {posts.isLoading && <div>Loading...</div>}
      {/* < className="flex flex-col gap-4"> */}
      <div className="max-w-sm rounded-box bg-base-300 p-2">
        {posts.data?.pages.map((page) => {
          return page.posts.map((post) => {
            return (
              <div className="p-4 hover:bg-base-100" key={post.id}>
                <Link href={`/posts/${post.id}`} className="">
                  <h2 className="text-lg font-bold">
                    {post.heading.slice(0, 40)}
                  </h2>
                  <p key={post.id}>{post.content.slice(0, 120)}</p>
                </Link>
              </div>
            );
          });
        })}

        {posts.hasNextPage && (
          <button
            className="btn btn-outline"
            onClick={() => void posts.fetchNextPage()}
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}

function Creators() {
  const { searchString } = useSearchMenu();
  const creators = api.fan.creator.search.useInfiniteQuery(
    { limit: 10, searchInput: searchString },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );
  return (
    <div className="flex flex-col items-center ">
      {creators.isLoading && <div>Loading...</div>}
      <div className="flex w-96 max-w-sm flex-col rounded-box bg-base-300 p-4">
        {creators.data?.pages.map((page) => {
          return page.items.map((creator) => {
            return <CreatorAvater key={creator.id} creator={creator} />;
          });
        })}

        {creators.hasNextPage && (
          <button
            className="btn btn-outline"
            onClick={() => void creators.fetchNextPage()}
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}

export function CreatorAvater({ creator }: { creator: Creator }) {
  return (
    <div className="flex items-center gap-2  p-2 px-4 hover:rounded-lg hover:bg-base-100">
      <div>
        <Avater url={creator.profileUrl} className="h-10 w-10" />
      </div>
      <div>
        <Link href={`/fans/creator/${creator.id}`} className="font-bold">
          {creator.name}
          <p className="text-xs text-slate-600">
            {creator.bio?.slice(0, 22)}....
          </p>
        </Link>
      </div>
    </div>
  );
}
// function AssetsList() {
//   const { searchString } = useSearchMenu();
//   const assets = api.shop.search.useInfiniteQuery(
//     { limit: 10, searchInput: searchString },
//     { getNextPageParam: (lastPage) => lastPage.nextCursor },
//   );
//   return (
//     <div className="flex flex-col items-center">
//       {assets.isLoading && <div>Loading...</div>}
//       <div className="w-full max-w-sm rounded-box bg-base-300 p-4">
//         {assets.data?.pages.map((page) => {
//           return page.items.map((asset) => {
//             return (
//               <div key={asset.id} className="p-4 hover:bg-base-100">
//                 <AssetItem shopItem={asset} />
//                 {/* <p className="font-bold">{asset.asset.code}</p>
//                 <p className="text-sm">
//                   {truncateString(asset.asset.issuer, 15, 5)}
//                 </p> */}
//               </div>
//             );
//           });
//         })}

//         {assets.hasNextPage && (
//           <button
//             className="btn btn-outline"
//             onClick={() => void assets.fetchNextPage()}
//           >
//             Load More
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }
