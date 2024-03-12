import React, { useEffect, useState } from "react";
import Link from "next/link";
import { extractHostnameFromURL } from "~/lib/helper/helper_client";
import log from "~/lib/logger/logger";
import { Play, XCircle } from "lucide-react";
// import ReactPlayer from "react-player";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import toast from "react-hot-toast";
import { useRightStore } from "~/lib/state/wallete/right";
import { useConnectWalletStateStore } from "package/connect_wallet";
import MyError from "../wallete/my_error";
import { useMarketRightStore } from "~/lib/state/marketplace/right";
import { Asset, Media, MediaType } from "@prisma/client";
import ImageVideViewer from "../wallete/Image_video_viewer";
import BuyModal from "../music/modal/buy_modal";
import PlaceMarketModal from "./modal/place_market_modal";
import { AssetType } from "../music/album/table";

export type MarketAssetType = Omit<Asset, "issuerPrivate">;

export default function MarketRight() {
  const { currentData } = useMarketRightStore();
  const { isAva, pubkey } = useConnectWalletStateStore();

  // if (!currentData)
  //   return (
  //     <div className="flex h-full w-full  items-start justify-center pt-10">
  //       <MyError text="No item selected" />
  //     </div>
  //   );

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
            <MediaViewer item={currentData} color={color} />
          </div>

          <div className="relative space-y-2 rounded-box border-4 border-base-100 p-4 text-sm tracking-wider">
            <div className="">
              <p>
                <span className="font-semibold">Name:</span> {"name"}
              </p>
              <p>
                <span className="font-semibold">Tag:</span>{" "}
                <span className="badge badge-primary">{"code"}</span>
                {/* {currentData.original && (
                  <span className="badge badge-secondary">Original</span>
                )} */}
              </p>

              <p className="line-clamp-2">
                <b>Description: </b> {"description"}
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
                <b>Media:</b> {"video"}
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
  if (currentData)
    return (
      <>
        <BuyModal item={{ asset: currentData }} />
        <PlaceMarketModal item={{ ...currentData, copies: 10 }} />
      </>
    );
}

// function DeleteButton({ path }: { path: string }) {
//   const { status } = useSession();
//   const { navPath } = useOpenStore();
//   const { setRightData } = useRightStore();

//   const utils = api.useContext();
//   const deleteMutation = api.nft.deleteNFT.useMutation({
//     onSuccess: async () => {
//       await utils.market.getMarketNft.refetch();
//       setRightData(undefined);
//     },
//   });

//   if (status == "authenticated" && navPath == NAVIGATION.MARKETPLACE) {
//     return (
//       <button
//         className="btn btn-secondary btn-sm w-full transition duration-500 ease-in-out"
//         onClick={() => deleteMutation.mutate({ path })}
//       >
//         {deleteMutation.isLoading && (
//           <span className="loading loading-spinner" />
//         )}
//         Delete
//       </button>
//     );
//   }
// }

function MediaViewer(props: { color: string; item: any }) {
  const { item, color } = props;
  // const { thumbnailUrl, mediaUrl, name } = item;
  const thumbnailUrl = "https://picsum.photos/200/200";
  const name = "vog";
  const mediaUrl = "https://picsum.photos/200/200";
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
