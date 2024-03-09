import { usePlayerStore } from "~/lib/state/music/track";

import React, { useState } from "react";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";

import { Song } from "@prisma/client";
import clsx from "clsx";
import MusicItem from "../track/music_item";
import { Play } from "lucide-react";
import BuyModal from "../modal/buy_modal";

export type SongWithAsset = Song & AssetType;

export type AssetType = {
  asset: {
    code: string;
    issuer: string;
    price: number;
    creatorId: string | null;
    thumbnail: string;
    name: string;
  };
};

export default function SongList({
  songs,
  albumId,
}: {
  songs: SongWithAsset[];
  albumId: number;
}) {
  const { status } = useSession();

  const [data, setData] = React.useState(songs);
  const [activeRow, setActiveRow] = useState<number>();
  // const [isDragAble, setIsDragAble] = useState();
  const [isDataChanged, setDataChanged] = useState(false);
  const trackUrlStore = usePlayerStore();
  const deleteSongMutation = api.music.song.deleteAsong.useMutation();

  const handleMusicEdit = (id: number) => {
    deleteSongMutation.mutate({ songId: id });
  };

  const playTheSong = (song: SongWithAsset) => {
    // toast("hei i'm cliked");
    trackUrlStore.setNewTrack(song);
  };

  return (
    <div className="p-2">
      {/* <div className="h-4" /> */}
      <table className="table bg-base-300">
        <thead></thead>
        <tbody>
          {songs.map((song) => {
            return (
              <tr
                key={song.id}
                className={clsx(activeRow == song.id ? "bg-base-300" : "hover")}
              >
                <td>
                  <div
                    className="space-x-3"
                    // onClick={() => info.playTheSong(info.row.original)}
                  >
                    <MusicItem item={song} />
                  </div>
                </td>

                <td>
                  {/* <Play
                    className={clsx(song.id == activeRow && "text-primary")}
                    onClick={() => {
                      setActiveRow(song.id);
                      trackUrlStore.setNewTrack(song);
                    }}
                  /> */}

                  <div className="w-12">
                    <BuyModal item={song} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {isDataChanged && songs.length > 0 && (
        <button
          className="btn btn-primary btn-sm"
          // onClick={() => handleOrderSave()}
        >
          Save
        </button>
      )}
    </div>
  );
}
