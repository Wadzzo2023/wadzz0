import { useSearchOpenStore } from "~/lib/state/wallete/searchOpen";
import { useEffect, useRef } from "react";
import { InfiniteScroll } from "./infinite-scroll";
import { MY_TAG_SIZE } from "~/lib/wallate/constants";
import { useSearchTagStore } from "~/lib/state/wallete/search_tag";
import useMyAssetTags from "~/lib/wallate/hooks/useMyAssetsTags";
import { useMySearchArrayStore } from "~/lib/state/wallete/my_search_array";
import { useMyAssetOpenStore } from "~/lib/state/wallete/my_asset_open";

export default function MyTags() {
  const stStore = useSearchTagStore();
  const soStore = useSearchOpenStore();
  const umaoStore = useMyAssetOpenStore();
  const { tags, hasMoreItems, getData } = useMyAssetTags();
  const divRef = useRef<HTMLDivElement>(null);
  const { value: rSearchArray } = useMySearchArrayStore();

  useEffect(() => {
    if (hasMoreItems && rSearchArray.length !== 0) {
      void getData();
    }
  }, [rSearchArray]);

  return (
    <div
      ref={divRef}
      style={{
        scrollbarGutter: "stable",
      }}
      className="scrollbar-style join flex w-full space-x-2 overflow-x-auto py-1"
    >
      <InfiniteScroll
        manualLoadFirstSet
        scrollDirection="horizontal"
        dataLength={tags.length}
        parentRef={divRef}
        loadMore={() => void getData()}
        hasMore={hasMoreItems && rSearchArray.length !== 0}
        loader={<div className="loading" />}
        batchSize={MY_TAG_SIZE}
      >
        <input
          onClick={() => {
            umaoStore.setOpen(true);
            soStore.setOpen(false);
          }}
          className="!btn join-item"
          key={""}
          type="radio"
          name="options"
          aria-label="Tags: "
        />
        {tags.map((item, i) => (
          <input
            type="radio"
            name="options"
            aria-label={item.name}
            onClick={() => {
              stStore.setData!({
                name: "Tag for",
                queryParams: `?tag=${item.name}`,
                value: item.name,
              });
              soStore.setOpen(false);
            }}
            className="!btn join-item"
            key={i}
          />
        ))}
      </InfiniteScroll>
    </div>
  );
}
