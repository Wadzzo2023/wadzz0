import { useSession } from "next-auth/react";
import { MouseEvent } from "react";
import AlbumCreate from "../modal/album_create";
import { ModalMode } from "../modal/modal_template";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import Image from "next/image";
import ConfirmationModal from "../modal/confirmation";
import { useContentWidthStore } from "~/lib/state/music/content_width";
import clsx from "clsx";
import { Album } from "@prisma/client";

export default function AlbumCover({
  album,
  songNumber,
}: {
  album: Album;
  songNumber: number;
}) {
  const { status } = useSession();
  const router = useRouter();
  const { width } = useContentWidthStore();
  const mutation = api.music.album.delete.useMutation();

  function handleAlbumDelete() {
    mutation.mutate({ albumId: album.id });
    router.back();
  }

  return (
    <div
      className={clsx(
        "flex  gap-2 py-5",
        (width ?? 400) > 500 ? "flex-row items-end" : "flex-col",
      )}
    >
      <div className="bg-neutral-focus h-48  w-48 flex-shrink-0 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-md">
        <Image
          src={album.coverImgUrl}
          height={192}
          width={192}
          alt="Cover"
          className="mr-6 bg-base-300"
        />
      </div>
      <div className="flex-1">
        <p className="text-3xl font-bold">{album.name}</p>
        <p className="text-sm"> {songNumber} songs</p>
        <p className="text-sm">{album.description}</p>
        {status == "authenticated" ? (
          <div className="flex flex-row gap-2  py-2">
            <AlbumCreate album={album} mode={ModalMode.EDIT} />
            <ConfirmationModal
              headerMessage="Do you realy want to delete this Album?"
              actionButton={
                <button className="btn btn-warning btn-sm w-20">Delete</button>
              }
            >
              <button
                className="btn btn-warning btn-sm w-20"
                onClick={handleAlbumDelete}
              >
                Delete
              </button>
            </ConfirmationModal>
          </div>
        ) : null}
      </div>
    </div>
  );
}
