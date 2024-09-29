import Image from "next/image";
import { twMerge } from "tailwind-merge";

function AssetView({
  code,
  thumbnail,
}: {
  code?: string;
  thumbnail: string | null;
}) {
  return (
    <>
      <div
        className="absolute m-0 h-full w-full bg-secondary p-0 opacity-30 "
        style={
          {
            // backgroundColor: "red",
          }
        }
      />
      <div className="flex flex-col gap-4">
        <div className="avatar m-0   rounded-xl bg-green-200 p-0">
          <div className="h-40 w-full rounded-xl  ">
            <Image
              height={1000}
              width={1000}
              alt={code ?? "asset"}
              style={{
                // backgroundColor: "red" ?? undefined,
                height: "100%",

                width: "100%",
              }}
              src={thumbnail ?? ""}
            />
          </div>
        </div>
        <p className="font-bold">{code}</p>
      </div>
    </>
  );
}

export default AssetView;
