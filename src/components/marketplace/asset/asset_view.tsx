import ImageVideViewer from "~/components/wallete/Image_video_viewer";

function AssetView({ code, thumbnail }: { code: string; thumbnail?: string }) {
  const color = "blue";
  const logoBlueData = "logoBlueData";

  return (
    <>
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
              url={thumbnail ?? "https://picsum.photos/100"}
              sizes="100%"
            />
          </div>
        </div>
        <p>{code}</p>
      </div>
    </>
  );
}

export default AssetView;
