import { usePlayerStore } from "~/lib/state/music/track";
import { api } from "~/utils/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/shadcn/ui/table";
import { Skeleton } from "~/components/shadcn/ui/skeleton";
import { Button } from "~/components/shadcn/ui/button";
import {
  Pause,
  Play,
} from "lucide-react";
import Image from "next/image";

import { usePlayer } from "~/components/context/PlayerContext";
import { useModal } from "~/lib/state/play/use-modal-store";
import type { SongItemType } from "~/lib/state/play/use-modal-store";

export default function SongList({
  songs,
  albumId: _albumId,
}: {
  songs: SongItemType[];
  albumId: number;
}) {
  const admin = api.wallate.admin.checkAdmin.useQuery();

  return (
    <div className="overflow-hidden rounded-2xl bg-white/75 backdrop-blur-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-14 text-xs font-semibold uppercase tracking-wide text-[#64748b]">
              #
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
              Song
            </TableHead>
            <TableHead className="w-24 text-xs font-semibold uppercase tracking-wide text-[#64748b]">
              Time
            </TableHead>
            <TableHead className="w-[180px] text-xs font-semibold uppercase tracking-wide text-[#64748b]">
              Action
            </TableHead>
            {admin.data && (
              <TableHead className="w-24 text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                Admin
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {songs.map((song, index) => (
            <TableRow
              key={song.id}
              className="bg-transparent transition-colors hover:bg-[#f8faff]"
            >
              <TableCell className="text-sm text-[#64748b]">{index + 1}</TableCell>
              <TableCell>
                <MusicItem item={song} />
              </TableCell>
              <TableCell className="text-sm text-[#64748b]">--:--</TableCell>
              <TableCell>
                <PlayOrBuy song={song} />
              </TableCell>
              {admin.data && (
                <TableCell>
                  <DeleteSongButton songId={song.id} />
                </TableCell>
              )}
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
  if (deleteSongMutation.isLoading)
    return <span className="loading loading-spinner" />;

  if (admin.data) {
    return (
      <Button
        className="h-9 rounded-full bg-[#0f172a] px-4 text-xs font-semibold text-white hover:bg-[#111827]"
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
  const userAssets = api.wallate.acc.getAccountInfo.useQuery();
  const { onOpen } = useModal();
  const {
    setCurrentTrack,
    setIsPlaying,
    setCurrentAudioPlayingId,
    currentTrack,
    isPlaying,
  } = usePlayer();

  if (userAssets.isLoading) return <Skeleton className="h-9 w-24" />;

  return (
    <div className="flex items-center gap-2">
      {userAssets.data?.dbAssets?.some(
        (el) => el.code === song.asset.code && el.issuer === song.asset.issuer,
      ) && (
        <Button
          variant="ghost"
          className="h-9 w-9 rounded-full border border-black/10 bg-white p-0 text-[#0f172a] hover:bg-[#f8faff]"
          onClick={() => {
            setCurrentAudioPlayingId(song.id);
            setIsPlaying(true);
            setCurrentTrack(song);
            trackUrlStore.setNewTrack({
              artist: song.artist,
              mediaUrl: song.asset.mediaUrl,
              thumbnail: song.asset.thumbnail,
              code: song.asset.code,
              name: song.asset.name,
            });
          }}
        >
          {currentTrack?.id === song.id && isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      )}

      <Button
        variant="default"
        className="h-9 rounded-full bg-[#0f172a] px-4 text-xs font-semibold text-white hover:bg-[#111827]"
        onClick={() =>
          onOpen("song buy modal", {
            Song: song,
          })
        }
      >
        Buy
      </Button>
    </div>
  );
}

export function MusicItem({
  item,
  playable,
}: {
  item: SongItemType;
  playable?: boolean;
}) {
  const trackUrlStore = usePlayerStore();
  const { setCurrentTrack } = usePlayer();

  const playSong = () => {
    if (playable) {
      trackUrlStore.setNewTrack({
        artist: item.artist,
        code: item.asset.code,
        thumbnail: item.asset.thumbnail,
        mediaUrl: item.asset.mediaUrl,
        name: item.asset.name,
      });
      setCurrentTrack(item);
    }
  };

  return (
    <div
      className="group flex cursor-pointer items-center gap-4"
      onClick={() => playSong()}
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-black/10 bg-white">
        <Image
          src={item.asset.thumbnail}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          alt={`${item.asset.code} cover`}
        />
      </div>
      <div className="min-w-0 flex-grow">
        <p className="truncate text-[15px] font-medium text-[#0f172a]">{item.asset.name}</p>
        <p className="truncate text-sm text-[#64748b]">{item.artist}</p>
      </div>
    </div>
  );
}
