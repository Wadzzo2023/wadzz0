import Link from "next/link";
import { extractHostnameFromURL } from "~/lib/helper/helper_client";
import { useRightStore } from "~/lib/state/wallete/right";
import { addrShort } from "~/utils/utils";
import CopyToClip from "./copy_to_Clip";
import ImageVideViewer from "./Image_video_viewer";
import MyError from "./my_error";
import { usePageAssetRightStore } from "~/lib/state/wallete/page_asset_right";

function PageAssetRight() {
  const { currentData } = usePageAssetRightStore();
  if (!currentData)
    return (
      <div className="flex h-full w-full  items-start justify-center">
        <MyError text="No item selected" />
      </div>
    );
  const { issuer, code } = currentData;
  const color = "blue";

  return (
    <div className=" h-full w-full">
      <div className="scrollbar-style relative h-full w-full overflow-y-auto rounded-xl ">
        <div
          className="absolute h-full w-full bg-base-200/50"
          style={
            {
              // backgroundColor: color,
            }
          }
        />
        <div className="flex h-full flex-col justify-start space-y-2 p-2">
          <div className="avatar relative w-full rounded-xl border-4 border-base-100 ">
            <div className="relative m-8 w-full ">
              <ImageVideViewer
                code={code}
                color={color}
                url={currentData.thumbnail ?? "https://picsum.photos/100"}
                blurData={"noting"}
              />
            </div>
            <p className="absolute bottom-2 flex w-full justify-center font-semibold">
              {code}
            </p>
          </div>

          <div className="relative  space-y-2 overflow-y-auto rounded-box border-4 border-base-100 p-4 text-sm tracking-wider scrollbar-hide">
            <div className="space-y-1 ">
              <div className="flex items-center justify-between gap-1">
                <p>
                  <span className="font-semibold">Asset Code:</span> {code}
                </p>
                <CopyToClip text={code} />
              </div>
              <div className="flex items-center justify-between gap-1">
                <p>
                  <span className="font-semibold">Issuer Address:</span>{" "}
                  {addrShort(currentData.issuer, 3)}
                </p>
                <CopyToClip text={currentData.issuer} collapse={5} />
              </div>
            </div>
            <div>
              <p className="font-semibold">CreatorID:</p>
              <p>{addrShort(currentData.creatorId, 6)} </p>
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Link:</span>{" "}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageAssetRight;
