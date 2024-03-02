import { useRef, useState } from "react";
import { useRightStore } from "~/lib/state/wallete/right";
import { useSearchTagStore } from "~/lib/state/wallete/search_tag";
import Loading from "./loading";
import type { AssetType } from "~/lib/wallate/interfaces";
import Asset from "./asset";
import MyError from "./my_error";
import { api } from "~/utils/api";

export default function AllAsset() {
  const divRef = useRef<HTMLDivElement>(null);

  const assets = api.wallate.asset.getAssets.useQuery();

  if (assets.isLoading) return <Loading />;
  if (assets.isError)
    return <MyError text="Error catch. Please reload this page." />;

  if (assets.data) {
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
          dataLength={assets.length}
          loadMore={() => void getData()}
          hasMore={hasMoreItems}
          loader={<div className="loading" />}
          batchSize={MY_PAGE_SIZE}
        > */}
        {assets.data.map((item, i) => (
          <Asset key={i} asset={item} />
        ))}
        {/* </InfiniteScroll> */}
      </div>
    );
  }
}
