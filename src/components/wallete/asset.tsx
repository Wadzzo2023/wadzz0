import React from "react";

import ImageVideViewer from "./Image_video_viewer";
import { AdminAsset } from "@prisma/client";

import { useModal } from "~/lib/state/play/use-modal-store";
import Image from "next/image";

export type AdminAssetWithTag = AdminAsset & {
  tags: {
    tagName: string;
  }[];
};

function Asset({ asset }: { asset: AdminAssetWithTag }) {
  const { logoUrl, logoBlueData, color, code } = asset;
  const { onOpen } = useModal();

  return (
    <div
      onClick={() => {
        onOpen("view admin asset", {
          adminAssetNtag: asset,
        });
      }}>

      <div
        className="absolute m-0 h-full w-full bg-secondary p-0 opacity-30"

      />
      <div className="flex flex-col space-y-2 ">
        <div className=" m-0   rounded-xl bg-green-200 p-0 ">
          <div className="h-40 w-full rounded-xl">
            <Image
              height={1000}
              width={1000}
              alt={code ?? "asset"}
              style={{
                // backgroundColor: "red" ?? undefined,
                height: "100%",

                width: "100%",
              }}
              src={logoUrl ?? ""}
            />
          </div>
        </div>
        <p>{code}</p>
      </div>

    </div>
  );
}

export default Asset;
