import ImageVideViewer from "~/components/wallete/Image_video_viewer";

function AssetView({ code }: { code: string }) {
  const color = "blue";
  const logoBlueData = "logoBlueData";
  
  return <>
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
      <p>{code}</p>
    </div>
  </>
}

export default AssetView;