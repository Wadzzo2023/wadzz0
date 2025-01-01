import { Card, CardContent } from "~/components/shadcn/ui/card"

import Image from 'next/image'
import { Album } from "@prisma/client";
import { api } from "~/utils/api";
import { addrShort } from "~/utils/utils";
interface AlbumCardProps {
    album: Album;
}

const AlbumList = () => {
    const albums = api.fan.music.getCreatorAlbums.useQuery();
    if (albums.isLoading) return <p>Loading...</p>;
    if (albums.error) return <p>Error: {albums.error.message}</p>;
    if (albums.data.length === 0) return <p>No albums found</p>;
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {albums.data.map(album => (
                <AlbumCard key={album.id} album={album} />
            ))}
        </div>
    );
}
export default AlbumList;


export function AlbumCard({ album }: AlbumCardProps) {
    return (
        <Card className="overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg">
            <div className="relative aspect-square">
                <Image
                    src={album.coverImgUrl}
                    alt={`${album.name} cover`}
                    fill
                    className="object-cover transition-all duration-300 group-hover:scale-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70 group-hover:opacity-90 transition-all duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="text-lg font-semibold line-clamp-1">{album.name}</h3>
                        <p className="text-sm opacity-90">{album.creatorId ? addrShort(album.creatorId, 5) : "Admin"}</p>
                    </div>
                </div>
            </div>
            <CardContent className="p-4 bg-white">
                <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-600">
                        Released: {new Date(album.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                        Creator: {album.creatorId ? addrShort(album.creatorId, 5) : "Admin"}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
