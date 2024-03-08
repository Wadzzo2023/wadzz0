import Card from "../home/card";
import Link from "next/link";
import { Album } from "@prisma/client";

export default function AlbumSection({ albums }: { albums: Album[] }) {
  if (albums.length > 0) {
    return albums.map((album) => {
      return (
        <Link href={`/music/album/${album.id}`}>
          <Card
            title={album.name}
            subtitle={album.description}
            imageUrl={album.coverImgUrl}
          />
        </Link>
      );
    });
  } else {
    return <p>No album</p>;
  }
}
