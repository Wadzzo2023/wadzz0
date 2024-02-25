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
    <div className="relative flex h-full w-full items-center justify-center ">
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
      fill
      sizes={sizes}
      alt={code}
      style={{
        backgroundColor: color ?? undefined,
      }}
      className={twMerge("rounded-full p-2", className)}
      src={url}
      placeholder={blurData ? "blur" : "empty"}
      blurDataURL={blurData ?? undefined}
    />
  );
}
