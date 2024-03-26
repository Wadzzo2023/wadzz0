import { useEffect, useState } from "react";
import { Play, XCircle } from "lucide-react";
// import ReactPlayer from "react-player";
import { api } from "~/utils/api";
import { useConnectWalletStateStore } from "package/connect_wallet";
import MyError from "../wallete/my_error";
import { useMarketRightStore } from "~/lib/state/marketplace/right";
import { Asset, MediaType, MarketAsset } from "@prisma/client";
import ImageVideViewer from "../wallete/Image_video_viewer";
import BuyModal from "../music/modal/buy_modal";

export type AssetType = Omit<Asset, "issuerPrivate">;

export type MarketAssetType = MarketAsset & {
  asset: AssetType;
};

export default function MarketRight() {
  const { currentData } = useMarketRightStore();
  const { isAva, pubkey } = useConnectWalletStateStore();

  if (!currentData)
    return (
      <div className="flex h-full w-full  items-start justify-center pt-10">
        <MyError text="No item selected" />
      </div>
    );

  const color = "blue";
  // const { name, description, type, mediaUrl } = currentData;
  // const issuer = nftAsset.issuer.pub;

  return (
    <div className="h-full max-h-[800px] w-full">
      <div className="scrollbar-style relative h-full w-full overflow-y-auto rounded-xl bg-base-100/90">
        <div
          className="absolute h-full w-full opacity-10"
          style={{
            backgroundColor: color,
          }}
        />
        <div className="flex h-full flex-col justify-between space-y-2 p-2">
          <div className="relative space-y-2 rounded-box border-4 border-base-100 p-1 text-sm tracking-wider">
            <MediaViewer
              mediaUrl={currentData.asset.mediaUrl}
              thumbnailUrl={currentData.asset.thumbnail}
              name={currentData.asset.name}
              color={color}
            />
          </div>

          <div className="relative space-y-2 rounded-box border-4 border-base-100 p-4 text-sm tracking-wider">
            <div className="">
              <p>
                <span className="font-semibold">Name:</span>{" "}
                {currentData.asset.name}
              </p>
              <p>
                <span className="font-semibold">Tag:</span>{" "}
                <span className="badge badge-primary">
                  {currentData.asset.code}
                </span>
                {/* {currentData.original && (
                  <span className="badge badge-secondary">Original</span>
                )} */}
              </p>

              <p className="line-clamp-2">
                <b>Description: </b> {currentData.asset.description}
              </p>
              <p>
                <span className="font-semibold">Available:</span> {10} copy
              </p>
              {/* {navPath == NAVIGATION.MARKETPLACE && (
                <p>
                  <span className="font-semibold">Price:</span>{" "}
                  {Number(currentData.price) + 50}
                </p>
              )} */}
              {/* {currentData.ownerAcc && (
                <p>
                  <b>Seller</b>: {addrShort(currentData.ownerAcc, 5)}
                </p>
              )} */}
              <p>
                <b>Media:</b> {currentData.asset.mediaType}
              </p>
            </div>
            <div className="space-y-2">
              <div>
                <OtherButtons />
                {/* {navPath == NAVIGATION.MARKETPLACE && (
                  <NFTCreateWithAuth mode={ModalMode.EDIT} nft={currentData} />
                )}
                <DeleteButton path={currentData.path} /> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OtherButtons() {
  const { currentData } = useMarketRightStore();
  const { pubkey } = useConnectWalletStateStore();

  if (currentData) {
    if (currentData.asset.creatorId == pubkey) {
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
            item={{ asset: currentData.asset }}
            price={currentData.price}
            placerId={currentData.placerId}
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
