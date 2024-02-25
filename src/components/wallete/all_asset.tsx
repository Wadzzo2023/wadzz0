import { useEffect, useRef, useState } from "react";
import { useRightStore } from "~/lib/state/wallete/right";
import { useSearchTagStore } from "~/lib/state/wallete/search_tag";
import Loading from "./loading";
import type { AssetType, GetAssetsType } from "~/lib/wallate/interfaces";
import Asset from "./asset";
import { MY_PAGE_SIZE } from "~/lib/wallate/constants";
import axios, { type AxiosResponse } from "axios";
import MyError from "./my_error";
import { InfiniteScroll } from "./infinite-scroll";

const asset: AssetType = {
  availableMarket: [],
  code: "vong",
  codeIssuer: "vong",
  color: "red",
  description: "vong cong",
  issuer: "vong",
  link: "vong",
  logoImg: { blurData: "data", url: "https://picsum.photos/200/200" },
  tags: [],
};
export default function AllAsset() {
  const { queryParams } = useSearchTagStore();
  const { setData } = useRightStore();
  const [assets, setAssets] = useState<AssetType[]>([asset]);

  const [error, setError] = useState(false);
  const lastPoint = useRef<null | string>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const [hasMoreItems, setHasMoreItems] = useState(true);

  // async function getData() {
  //   setError(false);
  //   try {
  //     const raw: AxiosResponse<GetAssetsType> = await axios.get(
  //       `/api/get-assets${queryParams}`,
  //       {
  //         params: {
  //           point: lastPoint.current,
  //         },
  //       },
  //     );

  //     const combinedItems = assets.concat(raw.data.assets || []);

  //     setHasMoreItems(raw.data.assets.length >= MY_PAGE_SIZE);

  //     const lastAsset = raw.data.assets[raw.data.assets.length - 1];
  //     if (lastAsset) {
  //       lastPoint.current = lastAsset.code;
  //     }
  //     setAssets(combinedItems);
  //   } catch (error) {
  //     console.error(error);
  //     setError(true);
  //   }
  // }

  // useEffect(() => {
  //   if (assets?.[0]) {
  //     setData(assets[0]);
  //   }
  // }, [assets]);

  if (!assets) {
    return <Loading />;
  } else if (error) {
    return <MyError text="Error catch. Please reload this page." />;
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
          dataLength={assets.length}
          loadMore={() => void getData()}
          hasMore={hasMoreItems}
          loader={<div className="loading" />}
          batchSize={MY_PAGE_SIZE}
        > */}
        {assets.map((item, i) => (
          <Asset key={i} asset={item} />
        ))}
        {/* </InfiniteScroll> */}
      </div>
    );
  }
}
