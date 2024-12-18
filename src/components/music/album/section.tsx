import Card from "../home/card";
import Link from "next/link";
import { Album } from "@prisma/client";

export default function AlbumSection({ albums }: { albums: Album[] }) {
  if (albums.length > 0) {
    return (
      <div className="flex gap-2">
        {albums.map((album) => {
          return (
            <Link key={album.id} href={`/music/album/${album.id}`}>
              <Card
                title={album.name}
                subtitle={album.description}
                imageUrl={album.coverImgUrl}
              />
            </Link>
          );
        })}
      </div>
    );
  } else {
    return <p>No album</p>;
  }
}
