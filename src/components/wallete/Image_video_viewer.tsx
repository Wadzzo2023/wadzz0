import { Suspense, useState } from "react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { VideoOff } from "lucide-react";

interface ImageVideoViewerProps {
  code: string;
  color?: string;
  url: string;
  blurData: string | null;
  sizes?: string;
  className?: string;
}

export default function ImageVideViewer({
  code,
  color,
  url,
  blurData,
  sizes,
  className,
}: ImageVideoViewerProps) {
  const [loading, setLoading] = useState(true);

  const isVideo = url.endsWith(".mp4");

  return isVideo ? (
    <div className="flex h-full w-full items-center justify-center ">
      {loading && <div className="loading absolute" />}
      <Suspense fallback={<VideoOff />}>
        <video
          className={twMerge("rounded-full p-2", className)}
          onPlay={() => setLoading(false)}
          style={{
            width: loading ? "0" : "100%",
            height: loading ? "0" : "100%",
            objectFit: "cover",
            objectPosition: "center",
            backgroundColor: color ?? undefined,
          }}
          src={url}
          autoPlay
          loop
          playsInline
          muted
        />
      </Suspense>
    </div>
  ) : (
    <Image
      // fill
      // sizes={sizes ?? "100"}
      height={1000}
      width={1000}
      alt={code ?? "image"}
      style={{
        backgroundColor: color ?? undefined,
        height: "100%",

        width: "100%",
      }}
      className={twMerge("rounded-full p-2", className)}
      src={url}
      placeholder={blurData ? "blur" : "empty"}
      blurDataURL={blurData ?? undefined}
    />
  );
}

export function ThumbNailView(props: { thumbnailUrl: string }) {
  const color = "blue";
  const { thumbnailUrl } = props;
  const code = "thumbnail";
  return (
    <div className="h-full w-full p-6">
      <Image
        // fill
        // sizes={sizes ?? "100"}
        height={1000}
        width={1000}
        alt={code}
        style={{
          backgroundColor: color ?? undefined,
          height: "100%",

          width: "100%",
        }}
        className={twMerge("rounded-full p-2")}
        src={thumbnailUrl}
        // placeholder={blurData ? "blur" : "empty"}
        // blurDataURL={blurData ?? undefined}
      />
    </div>
  );
}

export function VideoViewer({ url }: { url: string }) {
  const [loading, setLoading] = useState(true);

  // const url = "https://media.w3.org/2010/05/sintel/trailer_hd.mp4";

  return (
    <div className="flex h-full w-full items-center justify-center ">
      {loading && <div className="loading absolute" />}
      <Suspense fallback={<VideoOff />}>
        <video
          className={twMerge("rounded-sm p-2")}
          onPlay={() => setLoading(false)}
          style={{
            width: loading ? "0" : "100%",
            height: loading ? "0" : "100%",
            objectFit: "cover",
            objectPosition: "center",
            // backgroundColor: "red",
          }}
          src={url}
          autoPlay
          loop
          controls
          playsInline
          controlsList="nodownload"
          muted
        />
      </Suspense>
    </div>
  );
}

export function AudioViewer({
  url,
  thumbnailUrl,
}: {
  url: string;
  thumbnailUrl: string;
}) {
  const [loading, setLoading] = useState(true);

  // const url = "https://media.w3.org/2010/05/sintel/trailer_hd.mp4";

  return (
    <div className="flex h-full w-full flex-col items-center justify-center ">
      {loading && <div className="loading absolute" />}
      <ThumbNailView thumbnailUrl={thumbnailUrl} />
      <Suspense fallback={<VideoOff />}>
        <audio
          className={twMerge("rounded-sm p-2")}
          onPlay={() => setLoading(false)}
          style={{
            // width: loading ? "0" : "100%",
            // height: loading ? "0" : "100%",
            objectFit: "cover",
            objectPosition: "center",
            // backgroundColor: "red",
          }}
          src={url}
          // autoPlay
          loop
          controls
          playsInline
          controlsList="nodownload nofullscreen noplaybackrate noremoteplayback"
          muted
        />
      </Suspense>
    </div>
  );
}
