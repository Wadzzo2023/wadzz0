import { useEffect, useRef, useState } from "react";
import { useAssetLoadingStore } from "~/lib/state/wallete/asset_loading";
import MyError from "./my_error";
import { useConnectWalletStateStore } from "package/connect_wallet";

export default function MyAsset() {
  const { setLoading } = useAssetLoadingStore();
  const walletState = useConnectWalletStateStore();
  const [isWalletAva, setIsWalletAva] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsWalletAva(walletState.isAva);
  }, [walletState.isAva]);

 

  return isWalletAva ? (
    <>
      <div
        style={{
          scrollbarGutter: "stable",
        }}
        ref={divRef}
        className="main-asset-area"
      >
        {/* <InfiniteScroll
          parentRef={divRef}
          dataLength={myAssets.length}
          loadMore={() => void getData()}
          hasMore={!beforeDisable}
          loader={<div className="loading" />}
          batchSize={MY_PAGE_SIZE}
        >
          {myAssets.map((item, i) => (
            <Asset key={i} asset={item} />
          ))}
        </InfiniteScroll> */}
      </div>
      
    </>
  ) : (
    <MyError text="Connect your wallet" />
  );
}
