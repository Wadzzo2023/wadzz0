import Card from "../home/card";
import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import clsx from "clsx";
import { Album } from "@prisma/client";
import { useContentWidthStore } from "~/lib/state/music/content_width";

export default function AlbumSection({ albums }: { albums: Album[] }) {
  const { width } = useContentWidthStore();

  if (albums.length > 0)
    return (
      <Link href={`/album/${1}`}>
        <Card
          title={"album.name"}
          subtitle={"album.description"}
          imageUrl={"album.coverImgUrl"}
        />
      </Link>
    );
  else {
    return <p>No album</p>;
  }
}
export function getItemPerPage(width?: number) {
  if (width) {
    if (width < 300) {
      return 2;
    } else if (width >= 300 && width < 500) {
      return 4;
    } else if (width >= 500 && width < 650) {
      return 6;
    } else if (width >= 650 && width < 800) {
      return 8;
    } else {
      return 10;
    }
  } else {
    return 3;
  }
}
const AlbumItemWrapper = ({ children }: { children: ReactNode }) => {
  const { width: contentWidth } = useContentWidthStore();

  if (contentWidth) {
    // toast(
    //   `grid-cols-${Math.floor(
    //     contentWidth / 200,
    //   )} ${contentWidth} ${getItemPerPage(contentWidth)}`,
    // );
    return (
      <div>
        <div
          className={clsx(
            "grid auto-cols-min  gap-1",
            contentWidth < 300 && "grid-cols-1",
            contentWidth < 500 && contentWidth >= 300 && "grid-cols-2",
            contentWidth >= 500 && contentWidth <= 650 && "grid-cols-3",
            contentWidth > 650 && contentWidth < 800 && "grid-cols-4",
            contentWidth >= 800 && "grid-cols-5",
          )}
        >
          {children}
        </div>
      </div>
    );
  }
};
