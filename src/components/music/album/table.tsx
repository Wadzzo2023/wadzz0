import { Song, SongPrivacy } from "~/lib/types/dbTypes";
import { MusicItem } from "../track";
import { usePlayerStore } from "~/lib/states/track";
import { Heart, Trash2, Grip, Play } from "lucide-react";
import toast from "react-hot-toast";
import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import clsx from "clsx";
import isEqual from "lodash/isEqual";

import {
  CellContext,
  Row,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import React from "react";
import { HTML5Backend } from "react-dnd-html5-backend";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import { useTableStore } from "~/lib/states/table";
import BuyModal from "../modal/buy_modal";
import { useSongStore } from "~/lib/states/songs";
import ConfirmationModal from "../modal/confirmation";

const columnHelper = createColumnHelper<Song>();

const defaultColumns = [
  // columnHelper.accessor("serialNumber", {
  //   header: "#",
  // }),
  columnHelper.accessor((row) => row.name, {
    id: "Title",
    cell: (info: any) => {
      return (
        <div
          className="space-x-3"
          // onClick={() => info.playTheSong(info.row.original)}
        >
          <MusicItem item={info.row.original} albumId={info.albumId} />
        </div>
      );
    },
    header: () => undefined,
    // footer: (info) => info.column.id,
  }),
];

interface StaticRowProps {
  row: Row<Song>;
  albumId: string;
  playTheSong: (song: Song) => void;
}

export const StaticRow: FC<StaticRowProps> = ({
  row,
  playTheSong,
  albumId,
}) => {
  const trackStore = usePlayerStore();
  const mySong = useSongStore((state) => state.getUserSongs());
  // const userSongIds = useSongStore((state) => state.userSongIds);
  // const playTheSong = (song) => {

  // }
  const rowStore = useTableStore();
  return (
    <tr
      className={clsx(
        row.index == rowStore.activeRow ? "bg-base-300" : "hover",
        // rowStore.activeRow && rowStore.activeRow == row.index
        //   ? "bg-primary"
        //   : "",
      )}
    >
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id}>
          {flexRender(cell.column.columnDef.cell, {
            ...cell.getContext(),
            playTheSong: playTheSong,
            albumId: albumId,
          })}
        </td>
      ))}
      {/* <td>{row.original.duration ? row.original.duration : 3.5}</td> */}
      <td>
        {row.original.songAsset ? (
          <>
            {mySong.some((s) => s.id == row.original.id) ? (
              <Play
                className={clsx(
                  row.index == rowStore.activeRow && "text-primary",
                )}
                onClick={() => {
                  rowStore.setActiveRow(row.index);
                  trackStore.setNewTrack(row.original);
                }}
              />
            ) : (
              <div className="w-12">
                {row.original.privacy == SongPrivacy.RESTRICTED && (
                  <BuyModal item={row.original} />
                )}
              </div>
            )}
          </>
        ) : null}
      </td>
    </tr>
  );
};

export const DraggableRow: FC<{
  row: Row<Song>;
  albumId: string;
  reorderRow: (draggedRowIndex: number, targetRowIndex: number) => void;
  handleMusicEdit: (id: string) => void;
  playTheSong: (song: Song) => void;
}> = ({ row, reorderRow, albumId, playTheSong }) => {
  const trackStore = usePlayerStore();
  const [, dropRef] = useDrop({
    accept: "row",
    drop: (draggedRow: Row<Song>) => reorderRow(draggedRow.index, row.index),
  });

  const [{ isDragging }, dragRef, previewRef] = useDrag({
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    item: () => row,
    type: "row",
  });

  const rowStore = useTableStore();
  const utils = api.useContext();
  const deleteSongMutation = api.song.deleteAsong.useMutation({
    async onSuccess() {
      await utils.song.getAllSong.invalidate();
    },
  });

  const handleMusicEdit = (id: string) => {
    toast(`Selected song: ${id}`);
    deleteSongMutation.mutate({ songId: id, albumId });
  };

  return (
    <tr
      ref={previewRef} //previewRef could go here
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={clsx(
        "hover",
        rowStore.activeRow && rowStore.activeRow == row.index
          ? "bg-base-300"
          : "",
      )}
    >
      <td ref={dropRef}>
        <button ref={dragRef}>
          <Grip />
        </button>
      </td>
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id}>
          {flexRender(cell.column.columnDef.cell, {
            ...cell.getContext(),
            playTheSong: playTheSong,
            albumId: albumId,
          })}
        </td>
      ))}

      <td>
        <Play
          className={clsx(row.index == rowStore.activeRow && "text-primary")}
          onClick={() => {
            rowStore.setActiveRow(row.index);
            trackStore.setNewTrack(row.original);
          }}
        />
      </td>
      <td>
        {deleteSongMutation.isLoading ? (
          <span className="loading loading-spinner loading-md"></span>
        ) : (
          <ConfirmationModal
            headerMessage="Do you realy want to delete this?"
            actionButton={<Trash2 />}
          >
            <button
              className="btn btn-warning btn-sm w-20"
              onClick={() => handleMusicEdit(row.original.id)}
            >
              Delete
            </button>
          </ConfirmationModal>
        )}
      </td>
    </tr>
  );
};

export default function SongList({
  songs,
  albumId,
}: {
  songs: Song[];
  albumId: string;
}) {
  const { status } = useSession();
  const [columns] = React.useState(() => [...defaultColumns]);
  const [data, setData] = React.useState(songs);
  const [activeRow, setActiveRow] = useState<number>();
  // const [isDragAble, setIsDragAble] = useState();
  const [isDataChanged, setDataChanged] = useState(false);
  const trackUrlStore = usePlayerStore();
  const deleteSongMutation = api.song.deleteAsong.useMutation();

  const orderMutation = api.song.changeOrder.useMutation();

  const handleMusicEdit = (id: string) => {
    // toast(`Selected song: ${id}`);
    deleteSongMutation.mutate({ songId: id, albumId });
  };

  const playTheSong = (song: Song) => {
    // toast("hei i'm cliked");
    trackUrlStore.setNewTrack(song);
  };

  const reorderRow = (draggedRowIndex: number, targetRowIndex: number) => {
    setDataChanged(true);
    data.splice(targetRowIndex, 0, data!.splice(draggedRowIndex, 1)[0] as Song);
    setData([...data]);
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id, //good to have guaranteed unique row ids/keys for rendering
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
  });

  function handleOrderSave(): void {
    const prevIds = songs.map((song) => song.id);
    const ids = data.map((song) => song.id);
    if (isEqual(prevIds, ids)) {
      // setDataChanged(false);
      toast("data not hanged");
    } else {
      toast("data changed");
      // setDataChanged(true);
      // now run a mutation
    }

    orderMutation.mutate({ albumId: albumId, ids: ids });
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-2">
        {/* <div className="h-4" /> */}
        <table className="table">
          <thead>
            {table.getHeaderGroups().map((headerGroup, id) => (
              <tr key={headerGroup.id}>
                <th />
                {headerGroup.headers.map((header) => (
                  <th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              if (status === "authenticated")
                return (
                  <DraggableRow
                    albumId={albumId}
                    handleMusicEdit={handleMusicEdit}
                    playTheSong={playTheSong}
                    key={row.id}
                    row={row}
                    reorderRow={reorderRow}
                  />
                );
              else
                return (
                  <StaticRow
                    albumId={albumId}
                    playTheSong={playTheSong}
                    row={row}
                    key={row.id}
                  />
                );
            })}
          </tbody>
        </table>
        {isDataChanged && songs.length > 0 && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleOrderSave()}
          >
            Save
          </button>
        )}
      </div>
    </DndProvider>
  );
}
