import { useState } from "react";
// import ReactPlayer from "react-player";
import { api } from "~/utils/api";
import { useConnectWalletStateStore } from "package/connect_wallet";
import MyError from "../wallete/my_error";
import { Asset, MediaType } from "@prisma/client";
import {
  AudioViewer,
  ThumbNailView,
  VideoViewer,
} from "../wallete/Image_video_viewer";
import { useAssetRightStore } from "~/lib/state/assets_right";
import PlaceNFT2Storage from "../marketplace/modal/place_2storage_modal";
import EnableInMarket from "../marketplace/modal/place_market_modal";
import {
  AssetMenu,
  useAssetMenu,
} from "~/lib/state/marketplace/asset-tab-menu";
import NftBackModal from "../marketplace/modal/revert_place_market_modal";

export type MarketAssetType = Omit<Asset, "issuerPrivate">;

export default function AssetRight() {
  const { currentData } = useAssetRightStore();
  const { isAva, pubkey } = useConnectWalletStateStore();

  if (!currentData)
    return (
      <div className="flex h-full w-full  items-start justify-center pt-10">
        <MyError text="No item selected" />
      </div>
    );

  const color = "green";

  return (
    <div className="flex h-full flex-col gap-2 bg-base-300 p-2">
      <div className=" flex-1 rounded-xl border-4 border-base-100 bg-base-200/80 p-2">
        <MediaViewer
          type={currentData.mediaType}
          mediaUrl={currentData.mediaUrl}
          thumbnailUrl={currentData.thumbnail}
          name={currentData.name}
          color={color}
        />
      </div>
      <div className=" flex flex-1 flex-col rounded-xl border-4 border-base-100 bg-base-200/80 p-2">
        <>
          <div className="">
            <p>
              <span className="font-semibold">Name:</span> {currentData.name}
            </p>
            <p>
              <span className="font-semibold">Tag:</span>{" "}
              <span className="badge badge-primary">{currentData.code}</span>
            </p>

            <p className="line-clamp-2">
              <b>Description: </b> {currentData.description}
            </p>
            <p>
              <span className="font-semibold">Available:</span>{" "}
              {currentData.copies} copy
            </p>

            <p>
              <b>Media:</b> {currentData.mediaType}
            </p>
          </div>
          <div className="space-y-2">
            <div>
              <OtherButtons />
            </div>
          </div>
        </>
      </div>
    </div>
  );
}

function OtherButtons() {
  const { currentData } = useAssetRightStore();
  const { pubkey } = useConnectWalletStateStore();
  const { selectedMenu, setSelectedMenu } = useAssetMenu();

  if (currentData) {
    if (selectedMenu == AssetMenu.OWN) {
      return <PlaceNFT2Storage item={{ ...currentData, copies: 20 }} />;
    }
    if (selectedMenu == AssetMenu.STORAGE) {
      return (
        <MarketButtons code={currentData.code} issuer={currentData.issuer} />
      );
    }
  }
}

function MarketButtons({ code, issuer }: { code: string; issuer: string }) {
  const inMarket = api.wallate.acc.getAStorageAssetInMarket.useQuery({
    code,
    issuer,
  });
  if (inMarket.isLoading) return <div>Loading...</div>;

  if (inMarket.data)
    return (
      <div>
        Item is in market
        <NftBackModal item={{ code, issuer }} />
      </div>
    );
  else return <EnableInMarket item={{ code, issuer }} />;
}

function MediaViewer(props: {
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
        return <AudioViewer url={mediaUrl} thumbnailUrl={thumbnailUrl} />;

      default:
        return <ThumbNailView thumbnailUrl={thumbnailUrl} />;
    }
  }

  return <MediaPlay />;
}
