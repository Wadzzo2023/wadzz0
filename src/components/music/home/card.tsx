import { BlobOptions } from "buffer";
import Image from "next/image";

type CardProps = {
  imageUrl: string;
  title: string;
  subtitle: string;
};

export default function Card({ imageUrl, title, subtitle }: CardProps) {
  return (
    <div className="w-48 rounded-sm bg-base-200 p-4 shadow-sm duration-300  hover:bg-base-300">
      <Image
        className="h-40 w-40 overflow-clip"
        width={160}
        height={160}
        src={imageUrl}
        alt="Cover"
      />
      <div className="my-2">
        <h2 className="card-title truncate">{stringShort(title, undefined)}</h2>
        <p className="h-12">{stringShort(subtitle, 30)}</p>
      </div>
    </div>
  );
}

export function stringShort(text: string, n?: number) {
  if (n) {
    if (text.length <= n) {
      return text;
    } else {
      const firstPart = text.slice(0, n);
      // const lastPart = text.slice(-3); // Take the last 3 characters
      return firstPart + "...";
    }
  } else {
    return text;
  }
}
