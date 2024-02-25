import React from "react";
import { getTailwindScreenSize } from "~/lib/wallate/clientUtils";
import type { AssetType } from "~/lib/wallate/interfaces";
import { useRightStore } from "~/lib/state/wallete/right";
import ImageVideViewer from "./Image_video_viewer";

interface AssetProps {
  asset: AssetType;
}

function Asset({ asset }: AssetProps) {
  const { code, logoImg, color } = asset;
  const urs = useRightStore();
  return (
    <div>
      <button
        onClick={() => {
          urs.setData(asset);
          if (!getTailwindScreenSize().includes("xl")) {
            urs.setOpen(true);
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
                blurData={logoImg.blurData}
                code={code}
                url={logoImg.url}
                sizes="100px"
              />
            </div>
          </div>
          <p>
            {/* <Highlight hit={asset } attribute="code" /> */}
            Highight
          </p>
        </div>
      </button>
    </div>
  );
}

export default Asset;
