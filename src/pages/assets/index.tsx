import clsx from "clsx";
import AssetView from "~/components/marketplace/asset/asset_view";
import { MoreAssetsSkeleton } from "~/components/marketplace/platforms_nfts";
import {
  AssetMenu,
  useAssetMenu,
} from "~/lib/state/marketplace/asset-tab-menu";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/shadcn/ui/card";
import { ScrollArea } from "~/components/shadcn/ui/scroll-area";

import { useModal } from "~/lib/state/play/use-modal-store";
import { api } from "~/utils/api";
import { ValidCreateCreator } from "../fans/creator";
import { usePlayer } from "~/components/context/PlayerContext";
import React from "react";

export default function MyAssetsPage() {
  return (
    <div className="p-2">
      <div className="flex justify-center">
        <AssetTabs />
      </div>
      <RenderTabs />
    </div>
  );
}

function RenderTabs() {
  const { selectedMenu, setSelectedMenu } = useAssetMenu();
  switch (selectedMenu) {
    case AssetMenu.OWN:
      return <MyAssets />;
    case AssetMenu.STORAGE:
      return <MyStorageAsset />;
  }
}

function MyStorageAsset() {
  const acc = api.wallate.acc.getCreatorStorageInfo.useQuery();
  const { onOpen } = useModal();
  const { setCurrentTrack } = usePlayer();



  if (acc.isLoading) return <MoreAssetsSkeleton className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" />;

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


      </div >
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
  const { setCurrentTrack } = usePlayer();
  const { onOpen } = useModal();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = api.maps.pin.getMyCollectedPins.useInfiniteQuery(
    {
      limit: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  if (acc.isLoading || status === "loading") return <MoreAssetsSkeleton className="flex gap-2" />;
  if (acc.data ?? data)
    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {acc.data?.accAssets.length === 0 && (
            acc.data.dbAssets.map((asset, i) => (
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
            ))
          )}
          {

            data?.pages.map((pin, i) => (
              <React.Fragment key={i}>
                {
                  pin.items.map((item, j) => (
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
                        thumbnail={item.location.locationGroup?.image ?? "https://app.wadzzo.com/images/loading.png"}

                        isPinned={true}
                      />
                    </div>
                  )
                  )
                }
              </React.Fragment>
            ))

          }

        </div>
        {
          hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              className="btn btn-outline btn-primary"
            >
              {isFetchingNextPage ? "Loading..." : "Load More"}
            </button>
          )
        }
      </>
    );

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




