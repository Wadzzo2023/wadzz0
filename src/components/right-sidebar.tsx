import { useRouter } from "next/router";
import React from "react";
import { CreatorAvater } from "~/pages/search";
import { api } from "~/utils/api";

export default function RightBar() {
  const router = useRouter();
  if (router.pathname == "/")
    return (
      <div className=" hidden h-full w-60 overflow-y-auto rounded-lg bg-base-100/80 scrollbar-hide lg:flex">
        <AllCreators />
      </div>
    );
}
function AllCreators() {
  const creators = api.creator.getAllCreator.useInfiniteQuery(
    { limit: 5 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  return (
    <div className="w-full flex-col items-center  gap-4   pl-2 pt-5">
      <p className="text-2xl text-white">All creators</p>
      <ul>
        {creators.data?.pages.map((page) => {
          return page.items.map((creator) => {
            return (
              <li key={creator.id}>
                <CreatorAvater creator={creator} />
              </li>
            );
          });
        })}
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
  );
}
