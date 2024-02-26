import { usePlayerStore } from "~/lib/state/music/track";

import React, { useState } from "react";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";

import { Song } from "@prisma/client";

export default function SongList({
  songs,
  albumId,
}: {
  songs: Song[];
  albumId: number;
}) {
  const { status } = useSession();

  const [data, setData] = React.useState(songs);
  const [activeRow, setActiveRow] = useState<number>();
  // const [isDragAble, setIsDragAble] = useState();
  const [isDataChanged, setDataChanged] = useState(false);
  const trackUrlStore = usePlayerStore();
  const deleteSongMutation = api.music.song.deleteAsong.useMutation();

  const orderMutation = api.music.song.changeOrder.useMutation();

  const handleMusicEdit = (id: number) => {
    // toast(`Selected song: ${id}`);
    deleteSongMutation.mutate({ songId: id, albumId });
  };

  const playTheSong = (song: Song) => {
    // toast("hei i'm cliked");
    trackUrlStore.setNewTrack(song);
  };

  // function handleOrderSave(): void {
  //   const prevIds = songs.map((song) => song.id);
  //   const ids = data.map((song) => song.id);
  //   if (isEqual(prevIds, ids)) {
  //     // setDataChanged(false);
  //     toast("data not hanged");
  //   } else {
  //     toast("data changed");
  //     // setDataChanged(true);
  //     // now run a mutation
  //   }

  //   orderMutation.mutate({ albumId: albumId, ids: ids });
  // }

  return (
    <div className="p-2">
      {/* <div className="h-4" /> */}
      <table className="table">
        <thead></thead>
        <tbody>
          {songs.map((song) => {
            return (
              <tr>
                <th>1</th>
                <td>Cy Ganderton</td>
                <td>Quality Control Specialist</td>
                <td>Blue</td>
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
