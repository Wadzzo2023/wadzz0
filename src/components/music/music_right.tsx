import { usePlayerStore } from "~/lib/state/music/track"
import { api } from "~/utils/api"
import { PlayerSongCover } from "./player/player_song_cover"
import RightTrackSection from "./track/right_track"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/shadcn/ui/card"
import { ScrollArea } from "~/components/shadcn/ui/scroll-area"
import { Skeleton } from "~/components/shadcn/ui/skeleton"

export function MusicRightSide() {
  const { song, isPlaying, setisPlaying } = usePlayerStore()

  return (
    <div className="flex h-screen flex-col gap-4 p-1">
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Playable Songs</CardTitle>
        </CardHeader>
        <CardContent>
          <RightSongs />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Now Playing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="h-24 w-24 overflow-hidden rounded-lg">
              <PlayerSongCover song={song} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{song?.name ?? "No song selected"}</h3>
              <p className="text-sm text-muted-foreground">{song?.artist ?? "Unknown artist"}</p>
            </div>
          </div>
          {/* Audio player component can be added here */}
        </CardContent>
      </Card>
    </div>
  )
}

function RightSongs() {
  const songs = api.music.song.getUserBuyedSongs.useQuery()

  if (songs.isLoading)
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )

  if (songs.data)
    return (
      <ScrollArea className="h-[500px] pr-4">
        <RightTrackSection songs={songs.data} playable />
      </ScrollArea>
    )

  return null
}

