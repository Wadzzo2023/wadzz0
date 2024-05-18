import { MarketType } from "@prisma/client";
import { useMarketRightStore } from "~/lib/state/marketplace/right";
import { useRightStore } from "~/lib/state/wallete/right";
import { useTagStore } from "~/lib/state/wallete/tag";
import { api } from "~/utils/api";
import { AssetVariant } from "../right-sidebar";

export default function AllTags() {
  const { selectTag, selectedTag } = useTagStore();
  const { setData } = useRightStore();
  const { setData: setMarektData } = useMarketRightStore();

  return (
    <div
      style={{
        scrollbarGutter: "stable",
      }}
      className="scrollbar-style join flex w-full space-x-2 overflow-x-auto py-1"
    >
      <input
        className="!btn join-item"
        key={"All"}
        type="radio"
        name="options"
        aria-label="All: "
        onClick={() => {
          selectTag(undefined);
          setData(undefined);
          setMarektData(undefined);
        }}
      />
      <input
        className="!btn join-item"
        key={"BandCoin"}
        type="radio"
        name="options"
        aria-label="Bandcoin"
        onClick={() => {
          selectTag(AssetVariant.ADMIN);
          setData(undefined);
          setMarektData(undefined);
        }}
      />
      <input
        className="!btn join-item"
        type="radio"
        name="options"
        aria-label="Music"
        onClick={() => {
          selectTag(AssetVariant.SONG);
          setData(undefined);
          setMarektData(undefined);
        }}
      />
      <input
        className="!btn join-item"
        type="radio"
        name="options"
        aria-label="Other"
        onClick={() => {
          selectTag(AssetVariant.Other);
          setData(undefined);
          setMarektData(undefined);
        }}
      />
    </div>
  );

  // const tags = api.wallate.tag.getAllTags.useQuery();

  // if (tags.isLoading) return <div className="skeleton h-10 w-full" />;

  // if (tags.data)
  //   return (
  //     <div
  //       style={{
  //         scrollbarGutter: "stable",
  //       }}
  //       className="scrollbar-style join flex w-full space-x-2 overflow-x-auto py-1"
  //     >
  //       <input
  //         className="!btn join-item"
  //         key={"bandcoin"}
  //         type="radio"
  //         name="options"
  //         aria-label="Bandcoin: "
  //         onClick={() => {
  //           selectTag("bandcoin");
  //           setData(undefined);
  //         }}
  //       />
  //       <input
  //         className="!btn join-item"
  //         key={"tags"}
  //         type="radio"
  //         name="options"
  //         aria-label="Tags: "
  //         onClick={() => {
  //           selectTag(undefined);
  //           setData(undefined);
  //         }}
  //       />
  //       {tags.data.map((item, i) => (
  //         <input
  //           type="radio"
  //           name="options"
  //           aria-label={item.tagName}
  //           onClick={() => {
  //             selectTag(item.tagName);
  //             setData(undefined);
  //           }}
  //           className="!btn join-item"
  //           key={i}
  //         />
  //       ))}
  //     </div>
  //   );
}
