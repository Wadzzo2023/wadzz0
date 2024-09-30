import { Play, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
// import ReactPlayer from "react-player";
import { Asset, MarketAsset, MediaType } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useMarketRightStore } from "~/lib/state/marketplace/right";
import { api } from "~/utils/api";
import { addrShort } from "~/utils/utils";
import BuyModal from "../music/modal/buy_modal";
import ImageVideViewer, {
  AudioViewer,
  VideoViewer,
} from "../wallete/Image_video_viewer";
import MyError from "../wallete/my_error";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";
import { Button } from "../shadcn/ui/button";

import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { usePlayerStore } from "~/lib/state/music/track";

export type AssetType = Omit<Asset, "issuerPrivate">;

export type MarketAssetType = MarketAsset & {
  asset: AssetType;
};

export default function MarketRight() {
  const { currentData } = useMarketRightStore();

  if (!currentData)
    return (
      <div className="flex h-full w-full  items-start justify-center">
        <MyError text="No item selected" />
      </div>
    );

  return <AssetDetails currentData={currentData} />;
  // const { name, description, type, mediaUrl } = currentData;
  // const issuer = nftAsset.issuer.pub;
}

export function AssetDetails({
  currentData,
}: {
  currentData: MarketAssetType;
}) {
  const { setNewTrack } = usePlayerStore();

  const color = "#7ec34e";
  return (
    <div className=" h-full w-full">
      <div className="scrollbar-style relative h-full w-full overflow-y-auto rounded-xl">
        <div
          className="absolute h-full w-full bg-base-200/50"
          style={
            {
              // backgroundColor: color,
            }
          }
        />
        <div className="flex h-full flex-col justify-between space-y-2 p-2">
          <div className="flex h-full flex-col gap-2 ">
            <div className="relative flex-1 space-y-2 rounded-xl border-4 border-base-100 p-1 text-sm tracking-wider">
              <div className=" avatar w-full">
                {currentData.asset.tierId ? (
                  <MediaViewer
                    mediaUrl={currentData.asset.mediaUrl}
                    thumbnailUrl={currentData.asset.thumbnail}
                    name={currentData.asset.name}
                  />
                ) : (
                  <MediaViewForPublic
                    mediaUrl={currentData.asset.mediaUrl}
                    thumbnailUrl={currentData.asset.thumbnail}
                    name={currentData.asset.name}
                    type={currentData.asset.mediaType}
                    color="green"
                  />
                )}
              </div>
            </div>

            <div className="relative flex-1 space-y-2 rounded-xl border-4 border-base-100 p-4 text-sm tracking-wider">
              <div className="flex flex-col gap-2">
                <p>
                  <span className="font-semibold">Name:</span>{" "}
                  {currentData.asset.name}
                </p>
                <p>
                  <span className="badge badge-primary">
                    {currentData.asset.code}
                  </span>
                  {!currentData.placerId && (
                    <span className="badge badge-secondary">Original</span>
                  )}
                </p>

                <p className="line-clamp-2">
                  <b>Description: </b> {currentData.asset.description}
                </p>
                {currentData.asset.tierId ? (
                  <>
                    <p>
                      <span className="font-semibold">Available:</span>{" "}
                      <TokenCopies id={currentData.id} /> copy
                    </p>

                    <p>
                      <span className="font-semibold">
                        Price: {currentData.price} {PLATFORM_ASSET.code}
                      </span>
                    </p>
                  </>
                ) : (
                  <></>
                )}
                {currentData.placerId && (
                  <p>
                    <b>Seller</b>: <SellerInfo id={currentData.placerId} />
                  </p>
                )}
                <p>
                  <b>Media:</b> {currentData.asset.mediaType}
                </p>
              </div>
              <div className="space-y-2">
                <div>
                  <OtherButtons />
                </div>

                <DeleteAssetByAdmin id={currentData.id} />
                {!currentData.asset.tierId &&
                  currentData.asset.mediaType == "MUSIC" && (
                    <Button
                      onClick={() =>
                        setNewTrack({
                          artist:
                            currentData?.asset?.creatorId?.substring(0, 4) ??
                            "creator",
                          mediaUrl: currentData.asset.mediaUrl,
                          name: currentData.asset.name,
                          thumbnail: currentData.asset.thumbnail,
                          code: currentData.asset.code,
                        })
                      }
                      className="w-full"
                    >
                      Play{" "}
                    </Button>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SellerInfo({ id }: { id: string }) {
  const seller = api.fan.user.getUserById.useQuery(id);
  if (seller.isLoading) return <span>{addrShort(id, 5)}</span>;

  if (seller.data) return <span>{seller.data.name}</span>;
}

export function TokenCopies({ id }: { id: number }) {
  const copy = api.marketplace.market.getMarketAssetAvailableCopy.useQuery({
    id,
  });

  if (copy.isLoading)
    return <span className="loading loading-dots loading-sm" />;

  if (copy.data) return <span>{copy.data}</span>;
}

export function SongTokenCopies({
  code,
  issuer,
}: {
  code: string;
  issuer: string;
}) {
  const copy = api.marketplace.market.getSongAssetAvailableCopy.useQuery({
    code,
    issuer,
  });

  if (copy.isLoading) return <span className="loading loading-spinner" />;

  if (copy.data) return <span>{copy.data}</span>;
}

function OtherButtons() {
  const { currentData } = useMarketRightStore();
  const session = useSession();

  if (session.status == "authenticated")
    if (currentData) {
      if (currentData.asset.creatorId == session.data.user.id) {
        return (
          <DisableFromMarketButton
            code={currentData.asset.code}
            issuer={currentData.asset.issuer}
          />
        );
      } else if (currentData.asset.tierId)
        return (
          <>
            <BuyModal
              priceUSD={currentData.priceUSD}
              item={currentData.asset}
              price={currentData.price}
              placerId={currentData.placerId}
              marketItemId={currentData.id}
            />
          </>
        );
    }
}

export function DisableFromMarketButton({
  code,
  issuer,
}: {
  code: string;
  issuer: string;
}) {
  const { setData } = useMarketRightStore();
  const disable = api.marketplace.market.disableToMarketDB.useMutation({
    onSuccess() {
      setData(undefined);
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <button className="btn btn-primary btn-sm my-2 w-full transition duration-500 ease-in-out">
            {disable.isLoading && <span className="loading loading-spinner" />}
            DISABLE
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmation </DialogTitle>
          </DialogHeader>
          <div className="mt-6 w-full space-y-6 sm:mt-8 lg:mt-0 lg:max-w-xs xl:max-w-md">
            <div className="flow-root">
              <div className="-my-3 divide-y divide-gray-200 dark:divide-gray-800">
                <dl className="flex items-center justify-between gap-4 py-3">
                  <dd className="text-base font-medium text-gray-900 dark:text-white">
                    Do you want to disable this item from the market?
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <DialogFooter className=" w-full">
            <div className="flex w-full gap-4  ">
              <DialogClose className="w-full">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                disabled={disable.isLoading}
                variant="destructive"
                type="submit"
                onClick={() => disable.mutate({ code, issuer })}
                className="w-full"
              >
                Confirm
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function MediaViewForPublic(props: {
  color: string;
  thumbnailUrl: string;
  mediaUrl: string;
  name: string;
  type: MediaType;
}) {
  const { color, type } = props;
  const { thumbnailUrl, mediaUrl, name } = props;

  const [play, setPlay] = useState(true);

  function MediaPlay() {
    switch (type) {
      case MediaType.VIDEO:
        return <VideoViewer url={mediaUrl} />;

      case MediaType.MUSIC:
        return (
          <div className="flex h-full w-full items-center justify-center">
            <AudioViewer url={mediaUrl} thumbnailUrl={thumbnailUrl} />
          </div>
        );

      default:
        return <ThumbNailView name={name} thumbnailUrl={thumbnailUrl} />;
    }
  }

  return <MediaPlay />;
}
function MediaViewer(props: {
  // color: string;
  thumbnailUrl: string;
  mediaUrl: string;
  name: string;
}) {
  const { thumbnailUrl, mediaUrl, name } = props;
  // const thumbnailUrl = "https://picsum.photos/200/200";
  // const name = "vog";
  // const mediaUrl = "https://picsum.photos/200/200";
  const [play, setPlay] = useState(false);

  const type: MediaType = "IMAGE";

  useEffect(() => setPlay(false), [props]);

  function MediaPlay() {
    switch (type) {
      case MediaType.VIDEO:
        return (
          <>
            {/* <ReactPlayer url={mediaUrl} controls={true} width={"100%"} />; */}
            <div className="self-end">
              <XCircle onClick={() => setPlay(false)} />
            </div>
          </>
        );

      case MediaType.MUSIC:
        return (
          <div>
            <ThumbNailView name={name} thumbnailUrl={thumbnailUrl} />

            <Play
              onClick={() => setPlay(true)}
              className="absolute bottom-0 right-0"
            />
            <audio controls className="py-2">
              <source src={mediaUrl} type="audio/mpeg" />
            </audio>
          </div>
        );

      default:
        return <ThumbNailView name={name} thumbnailUrl={thumbnailUrl} />;
    }
  }

  return (
    <div className="avatar w-full">
      {play ? (
        <div className="flex items-center justify-center">
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <MediaPlay />
          </div>
        </div>
      ) : (
        <>
          <ThumbNailView name={name} thumbnailUrl={thumbnailUrl} />
          {/* <PlayMusicButon
            handlePlay={() => {
              toast.success("Playing music");
              setPlay(true);
            }}
          /> */}
        </>
      )}
    </div>
  );
}

// function PlayMusicButon({ handlePlay }: { handlePlay: () => void }) {
//   const { navPath } = useOpenStore();
//   if (navPath == NAVIGATION.MYNFTS)
//     return <Play onClick={handlePlay} className="absolute bottom-0 right-0" />;
// }
function ThumbNailView(props: { name: string; thumbnailUrl: string }) {
  const { name, thumbnailUrl } = props;
  return (
    <div className="relative m-8 w-full">
      <ImageVideViewer
        sizes="100%"
        className="h-full w-full"
        code={name}
        url={thumbnailUrl}
        blurData={"hi"}
      />
    </div>
  );
}

function TakeBack() {
  return <button className="btn btn-primary btn-sm w-full">You NFT</button>;
}

function DeleteAssetByAdmin({ id }: { id: number }) {
  const { setData } = useMarketRightStore();
  const [isOpen, setIsOpen] = useState(false);
  const admin = api.wallate.admin.checkAdmin.useQuery();
  const del = api.marketplace.market.deleteMarketAsset.useMutation({
    onSuccess: () => {
      setData(undefined);
      setIsOpen(false);
    },
  });

  if (admin.data)
    return (
      <>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button className="btn btn-primary btn-sm w-full">
              {del.isLoading && <span className="loading loading-spinner" />}
              Delete
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmation </DialogTitle>
            </DialogHeader>
            <div>
              <p>
                Are you sure you want to delete this item? This action is
                irreversible.
              </p>
            </div>
            <DialogFooter className=" w-full">
              <div className="flex w-full gap-4  ">
                <DialogClose className="w-full">
                  <Button variant="outline" className="w-full">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  type="submit"
                  onClick={() => del.mutate(id)}
                  disabled={del.isLoading}
                  className="w-full"
                >
                  {del.isLoading && (
                    <span className="loading loading-spinner" />
                  )}
                  Confirm
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
}
