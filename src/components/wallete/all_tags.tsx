import { MarketType } from "@prisma/client";
import { useMarketRightStore } from "~/lib/state/marketplace/right";
import { useRightStore } from "~/lib/state/wallete/right";
import { useTagStore } from "~/lib/state/wallete/tag";
import { api } from "~/utils/api";
import { AssetVariant } from "../right-sidebar";
import { PLATFROM_ASSET } from "~/lib/stellar/constant";

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
        key={PLATFROM_ASSET.code}
        type="radio"
        name="options"
        aria-label={PLATFROM_ASSET.code}
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
}
