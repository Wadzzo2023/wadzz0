import clsx from "clsx";
import { getCookie } from "cookies-next";
import { useEffect, useState } from "react";
import { useMarketRightStore } from "~/lib/state/marketplace/right";
import { useRightStore } from "~/lib/state/wallete/right";
import { useTagStore } from "~/lib/state/wallete/tag";
import { AssetVariant } from "../right-sidebar";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { CREATOR_TERM } from "~/utils/term";

export default function AllTags() {
  const { selectTag, selectedTag } = useTagStore();
  const { setData } = useRightStore();
  const { setData: setMarketData } = useMarketRightStore();
   const [layoutMode, setLayoutMode] = useState<"modern" | "legacy">("legacy");

  useEffect(() => {
    const storedMode = getCookie("wadzzo-layout-mode");
    if (storedMode === "modern") {
      setLayoutMode("modern");
    } else {
      setLayoutMode("legacy");
    }
  }, []);

  const handleSelect = (value: string | undefined) => {
    selectTag(value);
    setData(undefined);
    setMarketData(undefined);
  };

  const homeTabs = [
    { label: "ALL", value: undefined },
    { label: PLATFORM_ASSET.code.toUpperCase(), value: AssetVariant.ADMIN },
    { label: CREATOR_TERM.toUpperCase(), value: AssetVariant.Artists },
    { label: `${CREATOR_TERM.toUpperCase()} TOKEN`, value: AssetVariant.FAN },
  ] as const;

  if (layoutMode === "modern") {
    return (
      <div className="my-1 flex w-full justify-center">
        <div className="relative w-fit max-w-full overflow-x-auto rounded-[0.9rem] border border-black/15 bg-[#f3f1ea]/80 p-[0.3rem] shadow-[0_8px_24px_rgba(0,0,0,0.05)] scrollbar-hide">
          <div className="inline-flex items-center gap-0.5">
            {homeTabs.map((tab) => {
              const isActive = selectedTag === tab.value;
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => handleSelect(tab.value)}
                  className={clsx(
                    "relative inline-flex shrink-0 items-center justify-center rounded-[0.7rem] border px-3 py-1.5 text-sm font-normal transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                    isActive
                      ? "border-white/60 bg-white/55 text-black shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.92),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.72),_0_8px_20px_rgba(255,255,255,0.24)] backdrop-blur-[6px]"
                      : "border-transparent bg-transparent text-black/65 hover:bg-white/35 hover:text-black",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        scrollbarGutter: "stable",
      }}
      className="scrollbar-style join flex w-full gap-2 space-x-2 overflow-x-auto py-1"
    >
      {homeTabs.map((tab) => (
        <input
          className="!btn join-item"
          key={tab.label}
          type="radio"
          name="options"
          aria-label={tab.label}
          onClick={() => handleSelect(tab.value)}
          checked={selectedTag === tab.value}
          readOnly
        />
      ))}
    </div>
  );
}
