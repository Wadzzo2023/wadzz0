import { Play, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
// import ReactPlayer from "react-player";
import { Asset, MarketAsset, MediaType } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useMarketRightStore } from "~/lib/state/marketplace/right";
import { api } from "~/utils/api";
import { addrShort } from "~/utils/utils";
import BuyModal from "../music/modal/buy_modal";
import ImageVideViewer from "../wallete/Image_video_viewer";
import MyError from "../wallete/my_error";

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
  const color = "blue";
  return (
    <div className="max-h h-full w-full">
      <div className="scrollbar-style relative h-full w-full overflow-y-auto rounded-xl">
        <div
          className="absolute h-full w-full bg-base-200/50 "
          style={
            {
              // backgroundColor: color,
            }
          }
        />
        <div className="flex h-full flex-col justify-between space-y-2 p-2">
          <div className="flex h-full flex-col gap-2 ">
            <div className="relative flex-1 space-y-2 rounded-xl border-4 border-base-100 p-1 text-sm tracking-wider">
              <MediaViewer
                mediaUrl={currentData.asset.mediaUrl}
                thumbnailUrl={currentData.asset.thumbnail}
                name={currentData.asset.name}
                color={color}
              />
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
                <p>
                  <span className="font-semibold">Available:</span>{" "}
                  <TokenCopies id={currentData.id} /> copy
                </p>

                <p>
                  <span className="font-semibold">
                    Price: {currentData.price}{" "}
                  </span>
                </p>
                {currentData.placerId && (
                  <p>
                    <b>Seller</b>: {addrShort(currentData.placerId, 5)}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TokenCopies({ id }: { id: number }) {
  const { currentData } = useMarketRightStore();
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
      } else
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

  return (
    <button
      className="btn btn-secondary btn-sm my-2 w-full transition duration-500 ease-in-out"
      onClick={() => disable.mutate({ code, issuer })}
    >
      {disable.isLoading && <span className="loading loading-spinner" />}
      DISABLE
    </button>
  );
}

function MediaViewer(props: {
  color: string;
  thumbnailUrl: string;
  mediaUrl: string;
  name: string;
}) {
  const { color } = props;
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
        code={name}
        color={"blue"}
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
  const admin = api.wallate.admin.checkAdmin.useQuery();
  const del = api.marketplace.market.deleteMarketAsset.useMutation({
    onSuccess: () => {
      setData(undefined);
    },
  });

  if (admin.data)
    return (
      <button
        className="btn btn-warning btn-sm w-full"
        onClick={() => del.mutate(id)}
      >
        {del.isLoading && <span className="loading loading-spinner" />}Delete
      </button>
    );
}
