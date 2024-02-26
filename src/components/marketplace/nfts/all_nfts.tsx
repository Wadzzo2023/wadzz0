import { useEffect, useRef, useState } from "react";
import { useRightStore } from "~/lib/states/right";
import { useSearchTagStore } from "~/lib/states/search_tag";
import Loading from "../loading";
import type { AssetType, GetAssetsType } from "~/lib/interfaces";
import NftItem from "./nft_item";
import { MY_PAGE_SIZE } from "~/lib/constants";
import axios, { type AxiosResponse } from "axios";
import MyError from "../my_error";
import { InfiniteScroll } from "../infinite-scroll";
import { api } from "~/utils/api";
import { NFT } from "~/lib/types/dbTypes";
import toast from "react-hot-toast";
import { useConnectWalletStateStore } from "package/connect_wallet/src/state/connect_wallet_state";
import { useBalanceStore } from "~/lib/states/storageAcc";
import { useNftStore } from "~/lib/states/nfts";

export default function AllNft() {
  const { queryParams } = useSearchTagStore();
  const { setRightData: setData } = useRightStore();
  const [error, setError] = useState(false);
  const lastPoint = useRef<null | string>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const [hasMoreItems, setHasMoreItems] = useState(true);

  const { nfts, setNfts, setUserNftIds } = useNftStore();
  const { setBalances, setUserBalances } = useBalanceStore();
  const { data: combinedItems } = api.nft.getAllNft.useQuery(undefined, {
    onSuccess(data) {
      setNfts(data);
    },
  });

  api.steller.getStorageBalances.useQuery(undefined, {
    onSuccess(data) {
      setBalances(data);
    },
    refetchOnWindowFocus: false,
  });

  if (!nfts) {
    return <Loading />;
  } else if (error) {
    return (
      <MyError text="Your browser has closed connection. Please reload this page to fix the issue." />
    );
  } else {
    return (
      <div
        style={{
          scrollbarGutter: "stable",
        }}
        ref={divRef}
        className="main-asset-area"
      >
        {/* <InfiniteScroll
          parentRef={divRef}
          dataLength={nfts.length}
          loadMore={() => void getData()}
          hasMore={hasMoreItems}
          loader={<div className="loading" />}
          batchSize={MY_PAGE_SIZE}
        > */}
        {nfts.map((item, i) => (
          <NftItem key={i} item={item} />
        ))}
        {/* </InfiniteScroll> */}
      </div>
    );
  }
}
