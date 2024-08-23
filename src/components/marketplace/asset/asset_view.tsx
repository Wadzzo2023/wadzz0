import ImageVideViewer from "~/components/wallete/Image_video_viewer";
import Image from "next/image";
import { twMerge } from "tailwind-merge";

function AssetView({
  code,
  thumbnail,
}: {
  code: string;
  thumbnail?: string | null;
}) {
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
            <Image
              // fill
              // sizes={sizes ?? "100"}
              height={1000}
              width={1000}
              alt={code}
              style={{
                // backgroundColor: "red" ?? undefined,
                height: "100%",

                width: "100%",
              }}
              className={twMerge("rounded-full p-2")}
              src={thumbnail ?? "https://picsum.photos/200/300"}
            />
          </div>
        </div>
        <p>{code}</p>
      </div>
    </>
  );
}

export default AssetView;
