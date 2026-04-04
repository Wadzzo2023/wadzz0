import clsx from "clsx";
import { getCookie } from "cookies-next";
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

export default function MyAssetsPage() {
  const [layoutMode, setLayoutMode] = useState<"modern" | "legacy">("modern");

  useEffect(() => {
    const storedMode = getCookie("wadzzo-layout-mode");
    if (storedMode === "modern" || storedMode === "legacy") {
      setLayoutMode(storedMode);
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
      <RenderTabs />
    </div>
  );
}

function RenderTabs() {
  const { selectedMenu } = useAssetMenu();
  switch (selectedMenu) {
    case AssetMenu.OWN:
      return <MyAssets />;
    case AssetMenu.STORAGE:
      return <MyStorageAsset />;
  }
}

function MyStorageAsset() {
  const { setCurrentTrack } = usePlayer();

  const acc = api.wallate.acc.getCreatorStorageInfo.useQuery();
  const { onOpen } = useModal();

  if (acc.isLoading)
    return (
      <MoreAssetsSkeleton className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" />
    );

  if (acc.data)
    return (
      <div
        style={{
          scrollbarGutter: "stable",
        }}
        className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 "
      >
        {acc.data?.accAssets.length === 0 && (
          <p className="w-full text-center">You have no asset</p>
        )}
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
              />
            </div>
          );
        })}
      </div>
    );

  if (acc.data === undefined)
    return (
      <div>
        <ValidCreateCreator message="No storage account. Create one" />
      </div>
    );
}

function MyAssets() {
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

  if (acc.isLoading || status === "loading")
    return <MoreAssetsSkeleton className="flex gap-2" />;

  if (acc.data ?? data) {
    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          <>
            {acc.data?.dbAssets.map((asset, i) => (
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

  return null;
}

function AssetTabs() {
  const { selectedMenu, setSelectedMenu } = useAssetMenu();

  const creator = api.fan.creator.meCreator.useQuery();

  return (
    <div role="tablist" className="tabs-boxed tabs my-5 w-full max-w-md">
      {Object.values(AssetMenu).map((key) => {
        if (key == AssetMenu.STORAGE && creator.data == undefined) return null;
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
