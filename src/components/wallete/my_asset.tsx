import { useSession } from "next-auth/react";
import { useRef } from "react";
import MyError from "./my_error";

export default function MyAsset() {
  const divRef = useRef<HTMLDivElement>(null);

  const session = useSession();

  return session.status == "authenticated" ? (
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
