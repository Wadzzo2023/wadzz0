import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import { api } from "~/utils/api";
import MarketItem from "./market_item";
import React from "react";
import { MarketNFT } from "~/server/api/routers/marketplace/marketplace";

export enum MARKETPLACE_FILTER {
  ORIGINAL = "Primary Market",
  DUPLICATE = "Secondary Market",
}

function MarketNfts() {
  const [searchString, setSearchString] = useState<string>("");
  const [filter, setFilters] = useState<MARKETPLACE_FILTER>();

  // const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
  //   api.music.market.getMarketNft.useInfiniteQuery(
  //     {
  //       limit: 15,
  //     },
  //     {
  //       getNextPageParam: ({ lastItemPath }) => lastItemPath,
  //       refetchOnWindowFocus: false,
  //     },
  //   );

  // const { isLoading: allNftLoading, isSuccess } = api.market.getAllNft.useQuery(
  //   undefined,
  //   {
  //     onSuccess(data) {
  //       setNfts(data);
  //     },
  //   },
  // );

  const [currentPage, setCurrentPage] = useState(0);

  const divRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   if (data) {
  //     if (data.pages) {
  //       const marketNfts: MarketNFT[] = [];
  //       for (const page of data.pages) {
  //         for (const nft of page.nfts) {
  //           marketNfts.push(nft);
  //         }
  //       }
  //     }
  //   }
  // }, [data?.pages]);

  const isLoading = false;

  return (
    <>
      <div className="flex items-center justify-center px-4 pt-4">
        <input
          onChange={(e) => setSearchString(e.target.value)}
          type="text"
          placeholder="Search ..."
          className="input input-bordered w-full max-w-xs"
        />
      </div>

      <div className=" flex gap-2 p-2">
        {Object.values(MARKETPLACE_FILTER).map((v: MARKETPLACE_FILTER, i) => (
          <button
            key={i}
            className={clsx(
              "btn btn-outline btn-sm",
              v == filter ? "btn-active" : undefined,
            )}
            onClick={() => {
              // toast(v);
              if (v == filter) setFilters(undefined);
              else setFilters(v);
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="main-asset-area">
          {[0, 1, 2, 3, 4, 5, 6].map((el) => (
            <div key={el} className="skeleton h-36 w-full " />
          ))}
        </div>
      ) : (
        <div
          style={{
            scrollbarGutter: "stable",
          }}
          ref={divRef}
          className="main-asset-area"
        >
          {/* 
          <React.Fragment>
            {data?.pages[currentPage]?.nfts.map((nft, i) => {
              // if (nft.copies > 0) {
              return <MarketItem key={i} item={nft} />;
              // }
              // return null; // Ensure you always return something in a map function
            })}
          </React.Fragment>
            */}
        </div>
      )}

      {/*  <div className="flex justify-center">
        <div className="join">
          {data?.pages.map((page, pageIdx) => (
            <button
              key={pageIdx}
              className={clsx(
                "btn join-item",
                currentPage == pageIdx && "btn-active",
              )}
              onClick={() => setCurrentPage(pageIdx)}
            >
              {pageIdx + 1}
            </button>
          ))}
          {hasNextPage && (
            <button
              className="btn join-item"
              onClick={() => void (async () => await fetchNextPage())()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <span className="loading loading-spinner" />
              ) : (
                "»"
              )}
            </button>
          )}
        </div>
      </div>
              */}
    </>
  );
}

export default MarketNfts;
