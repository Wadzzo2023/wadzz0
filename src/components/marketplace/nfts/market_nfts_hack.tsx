import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useRightStore } from "~/lib/states/right";
import { api } from "~/utils/api";
import MarketItem from "./market_item";
import { useFetchedNFTStore } from "~/lib/states/fetched_nft";
import React from "react";
import { NFT, NFTPrivacy } from "~/lib/types/dbTypes";
import toast from "react-hot-toast";
import { MarketNFT } from "~/server/api/routers/marketplace";
import { useNftStore } from "~/lib/states/nfts";

export enum MARKETPLACE_FILTER {
  ORIGINAL = "Primary Market",
  DUPLICATE = "Secondary Market",
  NOT4SALE = "Not For Sale",
  SOLD = "Sold Out",
  FIND = "Find in Wadzzo",
}

function usePaginate(nfts: MarketNFT[], limit: number) {
  const [currentPage, setCurrentPage] = useState(1);

  const getPageItems = (page: number) => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return nfts.slice(startIndex, endIndex);
  };

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  const nextPage = () => {
    if (currentPage < Math.ceil(nfts.length / limit)) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  return {
    currentPage,
    getPageItems,
    goToPage,
    nextPage,
    prevPage,
  };
}

function MarketNfts() {
  const [searchString, setSearchString] = useState<string>("");
  const [filter, setFilters] = useState<MARKETPLACE_FILTER>();
  const { setNfts, search, nfts: allNft } = useNftStore();

  function filterNfts() {
    if (searchString.length < 1) {
      let filteredNft = allNft.filter((nft) => {
        if (nft.original && nft.copies > 0) return nft;
        else if (
          !nft.original &&
          nft.copies > 0 &&
          nft.privacy == NFTPrivacy.FOR_SALE
        )
          return nft;
      });
      if (filter) {
        filteredNft = allNft.filter((nft) => {
          switch (filter) {
            case MARKETPLACE_FILTER.ORIGINAL:
              return nft.original && nft.privacy == NFTPrivacy.FOR_SALE;
            case MARKETPLACE_FILTER.DUPLICATE:
              return !nft.original && nft.privacy == NFTPrivacy.FOR_SALE;
            case MARKETPLACE_FILTER.SOLD:
              return nft.copies < 1;
            case MARKETPLACE_FILTER.NOT4SALE:
              return nft.privacy == NFTPrivacy.NOT_FOR_SALE;
            case MARKETPLACE_FILTER.FIND:
              return nft.privacy == NFTPrivacy.FIND;
          }
        });
      }
      return filteredNft;
    }
    return search(searchString);
  }

  const nfts = filterNfts();
  const limit = 15;

  const { isLoading, isSuccess } = api.market.getAllNft.useQuery(undefined, {
    onSuccess(data) {
      setNfts(data);
    },
  });

  const { getPageItems, currentPage, nextPage, prevPage } = usePaginate(
    nfts,
    limit,
  );

  const divRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div className="flex items-center justify-center px-4 pt-4">
        <input
          onChange={(e) => {
            setFilters(undefined);
            setSearchString(e.target.value);
          }}
          value={searchString}
          type="text"
          placeholder="Search"
          className="input input-bordered w-full max-w-xs"
        />
      </div>

      <div className=" flex gap-2 overflow-x-auto p-2">
        {Object.values(MARKETPLACE_FILTER).map((v: MARKETPLACE_FILTER, i) => (
          <button
            key={i}
            className={clsx(
              "btn btn-outline btn-sm",
              v == filter ? "btn-active" : undefined,
            )}
            onClick={() => {
              // toast(v);
              setSearchString("");
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
          <React.Fragment>
            {getPageItems(currentPage).map((nft, i) => {
              return <MarketItem key={i} item={nft} />;
            })}
          </React.Fragment>
        </div>
      )}

      {nfts.length > limit && (
        <div className="flex justify-center">
          <div className="join">
            <button
              className="btn join-item"
              disabled={currentPage <= 1}
              onClick={() => prevPage()}
            >
              «
            </button>
            <button className="btn join-item">Page {currentPage}</button>
            <button className="btn join-item" onClick={() => nextPage()}>
              »
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default MarketNfts;
