import AlbumCreate from "../modal/album_create";
import { ModalMode } from "../modal/modal_template";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import Image from "next/image";
import ConfirmationModal from "../modal/confirmation";
import clsx from "clsx";
import { Album } from "@prisma/client";
import { ButtonSkeleton } from "~/pages/music/album/[album]";

export default function AlbumCover({
  album,
  songNumber,
}: {
  album: Album;
  songNumber: number;
}) {
  return (
    <div
      className={clsx(
        "flex  gap-2 py-5",
        // (width ?? 400) > 500 ? "flex-row items-end" : "flex-col",
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
        <AlbumAdminActionButtons album={album} />
      </div>
    </div>
  );
}

function AlbumAdminActionButtons({ album }: { album: Album }) {
  const router = useRouter();
  const mutation = api.music.album.delete.useMutation();
  const isAdmin = api.wallate.admin.checkAdmin.useQuery();

  if (isAdmin.isLoading) return <ButtonSkeleton />;

  function handleAlbumDelete() {
    mutation.mutate({ albumId: album.id });
    router.back();
  }

  if (isAdmin.data) {
    return (
      <div className="flex flex-row gap-2  py-2">
        <AlbumCreate album={album} mode={ModalMode.EDIT} />
        <ConfirmationModal
          headerMessage="Do you realy want to delete this Album?"
          actionButton={
            <button className="btn btn-primary btn-sm w-20">Delete</button>
          }
        >
          <button
            className="btn btn-ghost btn-sm w-20"
            onClick={handleAlbumDelete}
          >
            Delete
          </button>
        </ConfirmationModal>
      </div>
    );
  }
}
