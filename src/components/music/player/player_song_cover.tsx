import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/shadcn/ui/avatar"
import { Card, CardContent } from "~/components/shadcn/ui/card"
import { Music } from 'lucide-react'

interface Song {
  thumbnail: string
  artist: string
  name: string
  code: string
}

interface PlayerSongCoverProps {
  song?: Song
  small?: boolean
}

export function PlayerSongCover({ song, small = false }: PlayerSongCoverProps) {
  if (!song) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No song selected</p>
      </div>
    )
  }

  if (small) {
    return (
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={song.thumbnail} alt={`${song.name} cover`} />
          <AvatarFallback>
            <Music className="h-6 w-6 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1 overflow-hidden">
          <p className="truncate text-sm font-medium leading-none">{song.name}</p>
          <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
        </div>
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-square">
          <Image
            src={song.thumbnail}
            alt={`${song.name} cover`}
            layout="fill"
            objectFit="cover"
            priority
          />
        </div>
        <div className="p-4">
          <h3 className="truncate text-lg font-semibold">{song.name}</h3>
          <p className="truncate text-sm text-muted-foreground">{song.artist}</p>
        </div>
      </CardContent>
    </Card>
  )
}

