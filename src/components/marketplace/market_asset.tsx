import { getTailwindScreenSize } from "~/lib/clientUtils";
import ImageVideViewer from "../wallete/Image_video_viewer";
import { MarketAssetType } from "./market_right";
import { useMarketRightStore } from "~/lib/state/marketplace/right";

function MarketAssetComponent({item}:{item: MarketAssetType}) {
  const { thumbnail } = item;
  const color = "blue";
  const logoBlueData = "logoBlueData";

  const urs = useMarketRightStore();
  return (
    <div>
      <button
        onClick={() => {
          urs.setData(item);
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
                blurData={logoBlueData}
                code={"code"}
                url={"https://picsum.photos/200/300"}
                sizes="100px"
              />
            </div>
          </div>
          <p>
            {/* <Highlight hit={asset } attribute="code" /> */}
            {item.code}
          </p>
        </div>
      </button>
    </div>
  );
}

export default MarketAssetComponent;
