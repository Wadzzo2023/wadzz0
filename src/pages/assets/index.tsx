import clsx from "clsx";
import { getCookie } from "cookies-next";
import { motion } from "framer-motion";
import { PackageSearch, Store } from "lucide-react";
import AssetView from "~/components/marketplace/asset/asset_view";
import { MoreAssetsSkeleton } from "~/components/marketplace/platforms_nfts";
import {
  AssetMenu,
  useAssetMenu,
} from "~/lib/state/marketplace/asset-tab-menu";

import React, { useEffect, useState } from "react";
import { usePlayer } from "~/components/context/PlayerContext";
import { useModal } from "~/lib/state/play/use-modal-store";
import { api } from "~/utils/api";
import { ValidCreateCreator } from "../fans/creator";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";

export default function MyAssetsPage() {
  const [layoutMode, setLayoutMode] = useState<"modern" | "legacy">("legacy");

  useEffect(() => {
    const storedMode = getCookie("wadzzo-layout-mode");
    if (storedMode === "modern") {
      setLayoutMode("modern");
    } else {
      setLayoutMode("legacy");
    }
  }, []);

  const isModernLayout = layoutMode === "modern";

  return (
    <div
      className={clsx(
        "p-2 md:mx-auto",
        isModernLayout ? "md:w-[85vw]" : "w-full",
      )}
    >
      <div className="flex justify-center">
        <AssetTabs />
      </div>
      <RenderTabs isModernLayout={isModernLayout} />
    </div>
  );
}

function RenderTabs({ isModernLayout }: { isModernLayout: boolean }) {
  const { selectedMenu } = useAssetMenu();
  switch (selectedMenu) {
    case AssetMenu.OWN:
      return <MyAssets isModernLayout={isModernLayout} />;
    case AssetMenu.STORAGE:
      return <MyStorageAsset isModernLayout={isModernLayout} />;
  }
}

function MyStorageAsset({ isModernLayout }: { isModernLayout: boolean }) {
  const { setCurrentTrack } = usePlayer();

  const acc = api.wallate.acc.getCreatorStorageInfo.useQuery();
  const { onOpen } = useModal();

  const formatAssetPriceText = (asset: { marketPrice?: number | null; marketPriceUSD?: number | null }) => {
    if (typeof asset.marketPrice === "number") {
      return `${asset.marketPrice.toFixed(2)} ${PLATFORM_ASSET.code.toUpperCase()}`;
    }
    return "Not listed";
  };

  const formatAssetSubPriceText = (asset: { marketPriceUSD?: number | null }) => {
    if (typeof asset.marketPriceUSD === "number") {
      return `~$${asset.marketPriceUSD.toFixed(2)}`;
    }
    return undefined;
  };

  if (acc.isLoading)
    return (
      <MoreAssetsSkeleton className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" />
    );

  if (acc.data)
    return acc.data.dbAssets.length > 0 ? (
      <div
        style={{
          scrollbarGutter: "stable",
        }}
        className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 "
      >
        {acc.data?.dbAssets.map((asset, i) => {
          return (
            <div
              key={i}
              onClick={() => {
                setCurrentTrack(null);
                onOpen("my asset info modal", {
                  MyAsset: asset,
                });
              }}
              className="cursor-pointer"
            >
              <AssetView
                code={asset.name}
                thumbnail={asset.thumbnail}
                isNFT={true}
                priceText={formatAssetPriceText(asset)}
                subPriceText={formatAssetSubPriceText(asset)}
                actionLabel="View Details"
                onAction={() => {
                  setCurrentTrack(null);
                  onOpen("my asset info modal", {
                    MyAsset: asset,
                  });
                }}
              />
            </div>
          );
        })}
      </div>
    ) : isModernLayout ? (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 shadow-inner">
          <Store className="h-10 w-10 text-indigo-400" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">No assets listed</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Your secondary marketplace is empty. Start by creating or purchasing assets to see them here.
        </p>
      </motion.div>
    ) : (
      <p className="w-full text-center">You have no asset</p>
    );

  if (acc.data === undefined)
    return (
      <div>
        <ValidCreateCreator message="No storage account. Create one" />
      </div>
    );
}

function MyAssets({ isModernLayout }: { isModernLayout: boolean }) {
  const acc = api.wallate.acc.getAccountInfo.useQuery();

  const { onOpen } = useModal();
  const { setCurrentTrack } = usePlayer();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = api.maps.pin.getMyCollectedPins.useInfiniteQuery(
    {
      limit: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const formatAssetPriceText = (asset: { marketPrice?: number | null; marketPriceUSD?: number | null }) => {
    if (typeof asset.marketPrice === "number") {
      return `${asset.marketPrice.toFixed(2)} ${PLATFORM_ASSET.code.toUpperCase()}`;
    }
    return "Not listed";
  };

  const formatAssetSubPriceText = (asset: { marketPriceUSD?: number | null }) => {
    if (typeof asset.marketPriceUSD === "number") {
      return `~$${asset.marketPriceUSD.toFixed(2)}`;
    }
    return undefined;
  };

  if (acc.isLoading || status === "loading")
    return <MoreAssetsSkeleton className="flex gap-2" />;

  const dbAssets = acc.data?.dbAssets ?? [];
  const collectedPins = data?.pages.flatMap((p) => p.items) ?? [];
  const hasAssets = dbAssets.length > 0 || collectedPins.length > 0;

  if (hasAssets) {
    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          <>
            {dbAssets.map((asset, i) => (
              <div
                key={i}
                onClick={() => {
                  setCurrentTrack(null);
                  onOpen("my asset info modal", {
                    MyAsset: asset,
                  });
                }}
                className="cursor-pointer"
              >
                <AssetView
                  code={asset.name}
                  thumbnail={asset.thumbnail}
                  isNFT={true}
                  priceText={formatAssetPriceText(asset)}
                  subPriceText={formatAssetSubPriceText(asset)}
                  actionLabel="View Details"
                  onAction={() => {
                    setCurrentTrack(null);
                    onOpen("my asset info modal", {
                      MyAsset: asset,
                    });
                  }}
                />
              </div>
            ))}
          </>
          <>
            {data?.pages.map((pin, i) => (
              <React.Fragment key={i}>
                {pin.items.map((item, j) => (
                  <div
                    key={j}
                    onClick={() => {
                      setCurrentTrack(null);
                      onOpen("pin info modal", {
                        collectedPinInfo: item,
                      });
                    }}
                    className="cursor-pointer"
                  >
                    <AssetView
                      code={item.location.locationGroup?.title}
                      thumbnail={
                        item.location.locationGroup?.image ??
                        "https://app.wadzzo.com/images/loading.png"
                      }
                      isPinned={true}
                      actionLabel="View Details"
                      onAction={() => {
                        setCurrentTrack(null);
                        onOpen("pin info modal", {
                          collectedPinInfo: item,
                        });
                      }}
                    />
                  </div>
                ))}
              </React.Fragment>
            ))}
          </>
        </div>
        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            className="btn btn-outline btn-primary"
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </button>
        )}
      </>
    );
  }

  return isModernLayout ? (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-inner">
        <PackageSearch className="h-10 w-10 text-amber-400" />
      </div>
      <h3 className="text-xl font-semibold text-foreground">Your collection is empty</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Discover and collect NFTs or location pins from the marketplace to start building your collection.
      </p>
    </motion.div>
  ) : null;
}

function AssetTabs() {
  const { selectedMenu, setSelectedMenu } = useAssetMenu();
  const [layoutMode, setLayoutMode] = useState<"modern" | "legacy">("legacy");

  const creator = api.fan.creator.meCreator.useQuery();
  useEffect(() => {
    const storedMode = getCookie("wadzzo-layout-mode");
    if (storedMode === "modern") {
      setLayoutMode("modern");
    } else {
      setLayoutMode("legacy");
    }
  }, []);

  const tabs = Object.values(AssetMenu).filter((key) => {
    if (key == AssetMenu.STORAGE && creator.data == undefined) return false;
    return true;
  });

  if (layoutMode === "modern") {
    return (
      <div className="my-5 flex w-full justify-center">
        <div className="relative w-fit overflow-hidden rounded-[0.9rem] border border-black/15 bg-[#f3f1ea]/80 p-[0.3rem] shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
          <div className="inline-flex items-center gap-0.5">
            {tabs.map((key) => (
              <button
                key={key}
                type="button"
                onClick={handleClick(key)}
                className={clsx(
                  "relative inline-flex items-center justify-center rounded-[0.7rem] border px-3 py-1.5 text-sm font-normal transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                  selectedMenu === key
                    ? "border-white/60 bg-white/55 text-black shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.92),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.72),_0_8px_20px_rgba(255,255,255,0.24)] backdrop-blur-[6px]"
                    : "border-transparent bg-transparent text-black/65 hover:bg-white/35 hover:text-black",
                )}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div role="tablist" className="tabs-boxed tabs my-5 w-full max-w-md">
      {tabs.map((key) => {
        return (
          <a
            key={key}
            onClick={handleClick(key)}
            role="tab"
            className={clsx(
              "tab",
              selectedMenu == key && "tab-active text-primary",
              "font-bold",
            )}
          >
            {key}
          </a>
        );
      })}
    </div>
  );

  function handleClick(key: AssetMenu) {
    return () => {
      setSelectedMenu(key);
    };
  }
}
