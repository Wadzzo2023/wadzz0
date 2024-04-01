import { usePlayerStore } from "~/lib/state/music/track";

import { api } from "~/utils/api";

import MusicItem, { SongItemType } from "../track/music_item";
import { Play } from "lucide-react";
import BuyModal from "../modal/buy_modal";
import { ButtonSkeleton } from "~/pages/music/album/[album]";

export default function SongList({
  songs,
}: {
  songs: SongItemType[];
  albumId: number;
}) {
  return (
    <div className="py-2">
      {/* <div className="h-4" /> */}
      <table className="table bg-base-300">
        <thead></thead>
        <tbody>
          {songs.map((song) => {
            return (
              <tr
                key={song.id}
                // className={clsx(activeRow == song.id ? "bg-base-300" : "hover")}
              >
                <td>
                  <div className="space-x-3">
                    <MusicItem item={song} />
                  </div>
                </td>

                <td>
                  <PlayOrBuy song={song} />
                </td>

                <DeleteSongButton songId={song.id} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DeleteSongButton({ songId }: { songId: number }) {
  const admin = api.wallate.admin.checkAdmin.useQuery();
  const deleteSongMutation = api.music.song.deleteAsong.useMutation();

  if (admin.isLoading) return <ButtonSkeleton />;
  if (deleteSongMutation.isLoading)
    return <span className="loading loading-spinner" />;

  if (admin.data)
    return (
      <td>
        <button
          className="btn btn-warning btn-sm w-20"
          onClick={() => deleteSongMutation.mutate({ songId })}
        >
          Delete
        </button>
      </td>
    );
}

function PlayOrBuy({ song }: { song: SongItemType }) {
  const trackUrlStore = usePlayerStore();
  const userAssets = api.wallate.acc.getAccountInfo.useQuery();

  if (userAssets.isLoading) return <ButtonSkeleton />;

  if (
    userAssets.data?.dbAssets?.some(
      (el) => el.code === song.asset.code && el.issuer === song.asset.issuer,
    )
  ) {
    return (
      <>
        <Play
          // className={clsx(song.id == activeRow && "text-primary")}
          onClick={() => {
            // setActiveRow(song.id);
            trackUrlStore.setNewTrack(song);
          }}
        />
      </>
    );
  } else {
    return (
      <>
        <div className="w-12">
          <BuyModal item={song.asset} price={song.price} />
        </div>
      </>
    );
  }
}
