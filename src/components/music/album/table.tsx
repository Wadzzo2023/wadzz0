import { usePlayerStore } from "~/lib/state/music/track";
import { api } from "~/utils/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/shadcn/ui/table";
import { Skeleton } from "~/components/shadcn/ui/skeleton";
import { Button } from "~/components/shadcn/ui/button";
import { Pause, Play, PlayIcon } from "lucide-react";
import Image from "next/image";

import { usePlayer } from "~/components/context/PlayerContext";
import { SongItemType, useModal } from "~/lib/state/play/use-modal-store";


export default function SongList({
  songs,
  albumId,
}: {
  songs: SongItemType[];
  albumId: number;
}) {
  const admin = api.wallate.admin.checkAdmin.useQuery();

  return (
    <div className="py-2">
      <Table className="bg-base-300 rounded-md">
        <TableHeader>
          <TableRow className=" border-b-2 border-base-200">
            <TableHead>Song</TableHead>
            <TableHead>Action</TableHead>
            {
              admin.data && (
                <TableHead>Admin Action</TableHead>)
            }
          </TableRow>
        </TableHeader>
        <TableBody className="">
          {songs.map((song, index) => (
            <TableRow
              key={song.id}
              className="bg-base-300 hover:bg-base-100  w-full border-b-2 border-base-200"
            >
              <TableCell >
                <div className="space-x-3 ">
                  <MusicItem item={song} index={index + 1} />
                </div>
              </TableCell>
              <TableCell>
                <PlayOrBuy song={song} />
              </TableCell>
              {
                admin.data && (
                  <TableCell>
                    <DeleteSongButton songId={song.id} />
                  </TableCell>)
              }
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


export function DeleteSongButton({ songId }: { songId: number }) {
  const admin = api.wallate.admin.checkAdmin.useQuery();
  const deleteSongMutation = api.music.song.deleteAsong.useMutation();

  if (admin.isLoading) return <Skeleton className="h-9 w-20" />;
  if (deleteSongMutation.isLoading) return <span className="loading loading-spinner" />;

  if (admin.data) {
    return (
      <Button
        className="btn btn-primary btn-sm w-20"
        onClick={() => deleteSongMutation.mutate({ songId })}
      >
        Delete
      </Button>
    );
  }

  return null;
}

export function PlayOrBuy({ song }: { song: SongItemType }) {
  const trackUrlStore = usePlayerStore();
  const { } = usePlayer()
  const userAssets = api.wallate.acc.getAccountInfo.useQuery();
  const { onOpen } = useModal();
  const { setCurrentTrack, setIsPlaying, setCurrentAudioPlayingId, currentTrack, isPlaying } = usePlayer()
  if (userAssets.isLoading) return <Skeleton className="h-9 w-20" />;
  return (
    <>
      {
        userAssets.data?.dbAssets?.some(
          (el) => el.code === song.asset.code && el.issuer === song.asset.issuer,
        ) && (<Button
          variant="ghost"

          onClick={() => {
            setCurrentAudioPlayingId(song.id)
            setIsPlaying(true)
            setCurrentTrack(song)
            trackUrlStore.setNewTrack({
              artist: song.artist,
              mediaUrl: song.asset.mediaUrl,
              thumbnail: song.asset.thumbnail,
              code: song.asset.code,
              name: song.asset.name,
            });
          }}
        >
          {
            currentTrack?.id === song.id && isPlaying ? (
              <Pause className="h-6 w-6" />) : <Play className="h-6 w-6" />

          }
        </Button>)
      }




      <Button
        variant="default"

        onClick={() => onOpen("song buy modal", {
          Song: song,
        })}
      >
        Buy
      </Button>
    </>
  )

}



export function MusicItem({
  item,
  playable,
  index,
}: {
  item: SongItemType;
  playable?: boolean;
  index: number;
}) {
  const trackUrlStore = usePlayerStore();
  const { setCurrentTrack, currentTrack, isPlaying, setIsPlaying } = usePlayer()
  const playSong = () => {

    if (playable) {

      trackUrlStore.setNewTrack({
        artist: item.artist,
        code: item.asset.code,
        thumbnail: item.asset.thumbnail,
        mediaUrl: item.asset.mediaUrl,
        name: item.asset.name,
      });
      setCurrentTrack(item)
    }

  }

  return (
    <div
      className="flex items-center gap-4 cursor-pointer group"
      onClick={() => playSong()}
    >
      <div className="text-gray-500 w-6 text-right">{index}</div>
      <div className="relative h-12 w-12 overflow-hidden rounded-md shadow-md">
        <Image
          src={item.asset.thumbnail}
          layout="fill"
          objectFit="cover"
          alt={`${item.asset.code} cover`}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        {/* <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 transition-all duration-300 group-hover:bg-opacity-50">
          {
            currentTrack?.id === item.id && isPlaying ? (
              <Pause className="h-8 w-8" />) : <Play className="h-8 w-8" />

          }
        </div> */}
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-base font-medium text-gray-800 truncate">{item.asset.name}</p>
        <p className="text-sm text-gray-600 truncate">{item.artist}</p>
      </div>
    </div >
  );
}

