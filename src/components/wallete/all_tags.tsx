import { useMarketRightStore } from "~/lib/state/marketplace/right";
import { useRightStore } from "~/lib/state/wallete/right";
import { useTagStore } from "~/lib/state/wallete/tag";
import { api } from "~/utils/api";
import { AssetVariant } from "../right-sidebar";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { CREATOR_PLURAL_TERM, CREATOR_TERM } from "~/utils/term";

export default function AllTags() {
  const { selectTag, selectedTag } = useTagStore();
  const { setData } = useRightStore();
  const { setData: setMarketData } = useMarketRightStore();

  return (
    <div
      style={{
        scrollbarGutter: "stable",
      }}
      className="scrollbar-style join flex w-full gap-2 space-x-2 overflow-x-auto py-1"
    >
      <input
        className="!btn join-item"
        key={"All"}
        type="radio"
        name="options"
        aria-label="All"
        onClick={() => {
          selectTag(undefined);
          setData(undefined);
          setMarketData(undefined);
        }}
      />
      <input
        className="!btn join-item"
        key={PLATFORM_ASSET.code}
        type="radio"
        name="options"
        aria-label={PLATFORM_ASSET.code}
        onClick={() => {
          selectTag(AssetVariant.ADMIN);
          setData(undefined);
          setMarketData(undefined);
        }}
      />
      {/* <input
        className="!btn join-item"
        type="radio"
        name="options"
        aria-label="MUSIC"
        onClick={() => {
          selectTag(AssetVariant.SONG);
          setData(undefined);
          setMarektData(undefined);
        }}
      /> */}
      <input
        className="!btn join-item"
        type="radio"
        name="options"
        aria-label={CREATOR_PLURAL_TERM}
        onClick={() => {
          selectTag(AssetVariant.Artists);
          setData(undefined);
          setMarketData(undefined);
        }}
      />
      <input
        className="!btn join-item"
        type="radio"
        name="options"
        aria-label={`${CREATOR_TERM.toUpperCase()} TOKEN`}
        onClick={() => {
          selectTag(AssetVariant.FAN);
          setData(undefined);
          setMarketData(undefined);
        }}
      />
    </div>
  );
}
