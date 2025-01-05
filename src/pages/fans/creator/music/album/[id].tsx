'use client'

import { useParams } from "next/navigation"
import Image from "next/image"
import { api } from "~/utils/api"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/shadcn/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/shadcn/ui/table"
import { Skeleton } from "~/components/shadcn/ui/skeleton"
import { Button } from "~/components/shadcn/ui/button"
import { PlusCircle, Music, Disc } from 'lucide-react'
import { addrShort } from "~/utils/utils"
import { useState } from 'react'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/shadcn/ui/dialog"
import CreatorLayout from "../../layout"
import SongCreate from "~/components/fan/creator/music/create-song"
import { PLATFORM_ASSET } from "~/lib/stellar/constant"
import { DeleteSongButton, PlayOrBuy } from "~/components/music/album/table"
import { usePlayer } from "~/components/context/PlayerContext"

export default function Album() {
    const params = useParams()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const { setCurrentAudioPlayingId, setCurrentTrack, setIsPlaying } = usePlayer()
    const { data: album, isLoading, error } = api.fan.music.getAlbum.useQuery({
        id: Number(params?.id),
    }, {
        enabled: !!Number(params?.id),
    })

    if (isLoading) return <AlbumSkeleton />
    if (error) return <ErrorMessage message={error.message} />
    if (!album) return <ErrorMessage message="Album not found" />
    console.log(album)
    return (
        <CreatorLayout>
            <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-purple-100 to-indigo-100 min-h-screen">
                <Card className="overflow-hidden shadow-xl">
                    <div className="relative h-64 md:h-80">
                        <Image
                            src={album.coverImgUrl}
                            alt={album.name}
                            layout="fill"
                            objectFit="cover"
                            className="brightness-50"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <CardTitle className="text-4xl md:text-5xl font-bold text-white text-center drop-shadow-lg">
                                {album.name}
                            </CardTitle>
                        </div>
                    </div>
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="md:w-1/3">
                                <Image
                                    src={album.coverImgUrl}
                                    alt={album.name}
                                    width={300}
                                    height={300}
                                    className="rounded-lg shadow-lg"
                                />
                                <div className="mt-4 space-y-2">
                                    <p className="text-sm flex items-center">
                                        <Disc className="mr-2 h-4 w-4" />
                                        Created by: {album.creatorId ? addrShort(album.creatorId, 6) : 'Admin'}
                                    </p>
                                    <p className="text-sm flex items-center">
                                        <Music className="mr-2 h-4 w-4" />
                                        Release date: {new Date(album.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="md:w-2/3">
                                <h2 className="text-2xl font-semibold mb-4">Description</h2>
                                <p className="text-muted-foreground mb-6 max-h-[200px] overflow-y-auto">
                                    {album.description}
                                </p>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-semibold">Songs</h2>
                                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                size="sm"
                                                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                                            >
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Add Song
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-h-[700px] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Add New Song</DialogTitle>
                                                <DialogDescription>
                                                    Add a new song to this album. Please fill in all the required fields.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <SongCreate albumId={album.id} onSuccess={() => setIsDialogOpen(false)} />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <Card className="overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Title</TableHead>
                                                <TableHead>Asset Code</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead>Price in {PLATFORM_ASSET.code}</TableHead>
                                                <TableHead>Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {album.songs.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center py-8">
                                                        No songs found
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {album.songs.map((song) => (
                                                <TableRow key={song.id} className="hover:bg-gray-50">

                                                    <TableCell className="font-medium flex items-center gap-4 cursor-pointer group" >
                                                        <div className="relative h-12 w-12 overflow-hidden rounded-md shadow-md">
                                                            <Image
                                                                src={song.asset.thumbnail}
                                                                layout="fill"
                                                                objectFit="cover"
                                                                alt={`${song.asset.code} cover`}
                                                                className="transition-transform duration-300 group-hover:scale-105"
                                                            />

                                                        </div>
                                                        <div className="ml-2 truncate">
                                                            {song.asset.name}
                                                        </div>

                                                    </TableCell>
                                                    <TableCell>{song.asset.code}</TableCell>
                                                    <TableCell>${song.priceUSD.toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        {song.price.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell >
                                                        <DeleteSongButton songId={song.id} />
                                                        <Button
                                                            className="ml-2"
                                                            onClick={() => {
                                                                setCurrentAudioPlayingId(song.id)
                                                                setCurrentTrack({
                                                                    artist: song.asset.name,
                                                                    albumId: album.id,
                                                                    assetId: song.asset.id,
                                                                    id: song.id,
                                                                    asset: song.asset,
                                                                    createdAt: song.createdAt,
                                                                    creatorId: song.creatorId,
                                                                    price: song.price,
                                                                    priceUSD: song.priceUSD,
                                                                })
                                                                setIsPlaying(true)
                                                            }}
                                                        >
                                                            Play
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </CreatorLayout>
    )
}

function AlbumSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-purple-100 to-indigo-100 min-h-screen">
            <Card className="overflow-hidden shadow-xl">
                <Skeleton className="h-64 md:h-80 w-full" />
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="md:w-1/3">
                            <Skeleton className="w-[300px] h-[300px] rounded-lg" />
                            <div className="mt-4 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                        <div className="md:w-2/3">
                            <Skeleton className="h-8 w-1/2 mb-4" />
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-3/4 mb-6" />
                            <Skeleton className="h-8 w-1/4 mb-4" />
                            <Card>
                                <Skeleton className="h-10 w-full mb-2" />
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full mb-2" />
                                ))}
                            </Card>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-purple-100 to-indigo-100 min-h-screen flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardContent className="p-6 text-center">
                    <h2 className="text-2xl font-semibold mb-4 text-red-600">Error</h2>
                    <p>{message}</p>
                </CardContent>
            </Card>
        </div>
    )
}


