import clsx from "clsx";
import { useRef, useState } from "react";
import { useRightStore } from "~/lib/states/right";
import { api } from "~/utils/api";
import MarketItem from "./market_item";
import { useFetchedNFTStore } from "~/lib/states/fetched_nft";
import SearchBar from "./search_bar";
import NftItem from "./nft_item";

export enum MARKETPLACE_FILTER {
  ORIGINAL = "ORIGINAL",
  DUPLICATE = "DUPLICATE",
}

function SearchNfts() {
  const [searchString, setSearchString] = useState<string>("");

  const { search } = useFetchedNFTStore();
  const searchedResult = search(searchString);

  return (
    <>
      <div className="flex items-center justify-center p-4">
        <input
          onChange={(e) => setSearchString(e.target.value)}
          type="text"
          placeholder="Search ..."
          className="input input-bordered w-full max-w-xs"
        />
      </div>
      <div
        style={{
          scrollbarGutter: "stable",
        }}
        className="main-asset-area"
      >
        {searchedResult.map((nft, i) => (
          <MarketItem key={i} item={nft} />
        ))}
      </div>
    </>
  );
}

export default SearchNfts;
