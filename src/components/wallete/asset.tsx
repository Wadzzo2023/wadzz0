import React from "react";
import { getTailwindScreenSize } from "~/lib/clientUtils";
import { useRightStore } from "~/lib/state/wallete/right";
import ImageVideViewer from "./Image_video_viewer";
import { AdminAsset } from "@prisma/client";
import { usePopUpState } from "~/lib/state/right-pop";

export type AdminAssetWithTag = AdminAsset & {
  tags: {
    tagName: string;
  }[];
};
function Asset({ asset }: { asset: AdminAssetWithTag }) {
  const { logoUrl, logoBlueData, color, code } = asset;
  const urs = useRightStore();
  const pop = usePopUpState();

  return (
    <div>
      <button
        onClick={() => {
          urs.setData(asset);
          if (!getTailwindScreenSize().includes("xl")) {
            pop.setOpen(true);
          }
        }}
        className="btn relative h-fit w-full overflow-hidden  py-4 "
      >
        <div
          className="absolute h-full w-full opacity-30"
          style={{
            backgroundColor: color,
          }}
        />
        <div className="flex flex-col space-y-2 ">
          <div className="avatar ">
            <div className="relative w-24 rounded-full">
              <ImageVideViewer
                blurData={logoBlueData}
                code={code}
                url={logoUrl}
                sizes="100px"
              />
            </div>
          </div>
          <p>{code}</p>
        </div>
      </button>
    </div>
  );
}

export default Asset;
