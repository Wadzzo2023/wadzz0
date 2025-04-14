import { useState } from "react";
// import ReactPlayer from "react-player";
import { Asset, MediaType } from "@prisma/client";
import { useAssetRightStore } from "~/lib/state/assets_right";
import {
  AssetMenu,
  useAssetMenu,
} from "~/lib/state/marketplace/asset-tab-menu";
import StorageCreateDialog from "../marketplace/modal/place_2storage_modal";
import { MarketButtons } from "../modals/modal-action-button";
import {
  AudioViewer,
  ThumbNailView,
  VideoViewer,
} from "../wallete/Image_video_viewer";
import MyError from "../wallete/my_error";

export type MarketAssetType = Omit<Asset, "issuerPrivate">;

export default function AssetRight() {
  const { currentData } = useAssetRightStore();

  if (!currentData)
    return (
      <div className="flex h-full w-full  items-start justify-center pt-10">
        <MyError text="No item selected" />
      </div>
    );

  const color = "green";

  return (
    <div className="flex h-full flex-col gap-2 bg-base-200/50 p-2">
      <div className=" flex-1  rounded-xl border-4 border-base-100 p-2">
        <div className="avatar w-full">
          <MediaViewer
            type={currentData.mediaType}
            mediaUrl={currentData.mediaUrl}
            thumbnailUrl={currentData.thumbnail}
            name={currentData.name}
            color={color}
          />
        </div>
      </div>
      <div className=" flex flex-1 flex-col rounded-xl border-4 border-base-100 p-2">
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
              {currentData.copies ?? 0} copy
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
  const { selectedMenu, setSelectedMenu } = useAssetMenu();

  if (currentData) {
    if (selectedMenu == AssetMenu.OWN) {
      return <StorageCreateDialog item={{ ...currentData }} />;
    }
    if (selectedMenu == AssetMenu.STORAGE) {
      return (
        <MarketButtons
          name={currentData.name}
          copy={currentData.copies}
          code={currentData.code}
          issuer={currentData.issuer}
        />
      );
    }
  }
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
