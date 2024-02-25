import { useSearchOpenStore } from "~/lib/state/wallete/searchOpen";
import useAssetTags from "~/lib/wallate/hooks/useAssetsTags";
import { useRef } from "react";
import { InfiniteScroll } from "./infinite-scroll";
import { TAG_SIZE } from "~/lib/wallate/constants";
import { useSearchTagStore } from "~/lib/state/wallete/search_tag";

export default function AllTags() {
  const stStore = useSearchTagStore();
  const soStore = useSearchOpenStore();
  const { tags, hasMoreItems, getData } = useAssetTags();
  const divRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={divRef}
      style={{
        scrollbarGutter: "stable",
      }}
      className="scrollbar-style join flex w-full space-x-2 overflow-x-auto py-1"
    >
      <InfiniteScroll
        scrollDirection="horizontal"
        dataLength={tags.length}
        parentRef={divRef}
        loadMore={() => void getData()}
        hasMore={hasMoreItems}
        loader={<div className="loading" />}
        batchSize={TAG_SIZE}
      >
        <input
          onClick={() => {
            stStore.reset!();
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
