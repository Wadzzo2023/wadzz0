import Link from "next/link";
import { Album } from "@prisma/client";
import Image from "next/image";

export default function AlbumSection({ albums }: { albums: Album[] }) {
  if (albums.length > 0) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {albums.map((album) => (
          <Link key={album.id} href={`/music/album/${album.id}`}>
            <div className="group cursor-pointer space-y-2">
              <div className="relative aspect-square overflow-hidden rounded-md shadow-md">
                <Image
                  src={album.coverImgUrl}
                  alt={album.name}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-800 line-clamp-1">{album.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{album.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  } else {
    return <p className="text-center text-gray-600">No albums available</p>;
  }
}

