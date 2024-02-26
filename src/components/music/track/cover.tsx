import { useSession } from "next-auth/react";
import { Album, Song } from "~/lib/types/dbTypes";
import { MouseEvent } from "react";
import AlbumCreate from "../modal/album_create";
import { ModalMode } from "../modal/modal_template";
import { api } from "~/utils/api";
import router, { useRouter } from "next/router";
import SongCreate from "../modal/song_create";
import Image from "next/image";
import Link from "next/link";
import { usePlayerStore } from "~/lib/states/track";
import ConfirmationModal from "../modal/confirmation";
import { AssetBadge } from "./asset_badge";
import { useSongStore } from "~/lib/states/songs";
import { Balance4, useBalanceStore } from "~/lib/states/storageAcc";
import clsx from "clsx";
import { useContentWidthStore } from "~/lib/states/content_width";
import { useAlbumStore } from "~/lib/states/album";

export default function TrackCover({ song }: { song: Song }) {
  const { status } = useSession();
  const { setNewTrack } = usePlayerStore();
  const { width } = useContentWidthStore();
  const { userSongIds: songsId } = useSongStore();
  const album = useAlbumStore(state => state.getAlbum(song.albumId))
  const mutation = api.song.deleteAsong.useMutation();


  const buyedCopies = useBalanceStore((state) =>
    state.getAssetBalance({
      code: song.songAsset?.code,
      issuer: song.songAsset?.issuer.pub,
      limit: true,
      for: Balance4.USER,
    }),
  );

  function handleTrackDelete() {
    mutation.mutate({ songId: song.id, albumId: song.albumId });
    router.back();
  }

  return (
    <div
      className={clsx(
        "flex  gap-2   py-5",
        (width ?? 400) > 500 ? "flex-row items-end" : "flex-col",
      )}
    >
      <div className="mr-4 h-48  w-48 flex-shrink-0 bg-neutral-focus shadow-md">
        <Image
          src={song.coverImgUrl}
          height={192}
          width={192}
          alt="Cover"
          className="mr-6 bg-base-300 object-cover"
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-3xl font-bold">{song.name}</p>
        <Link href={`/album/${song.albumId}`}>
          <p className="text-sm font-bold hover:text-accent">
            Album: {album?.name}
          </p>
        </Link>
        <p className="text-sm">Artist: {song.artist}</p>
        {song.songAsset && (
          <div>
            <div>
              Asset: <AssetBadge asset={song.songAsset} />{" "}
              <div className="badge badge-md text-warning">{buyedCopies}</div>
              {/* <span className="badge badge-accent">{song.songAsset.code}</span> */}
            </div>
            {song.songAsset?.description.length > 0 && (
              <p className="text-sm">
                Description: {song.songAsset?.description}
              </p>
            )}
          </div>
        )}
        {songsId.includes(song.id) && (
          <p className="text-sm">You have {buyedCopies} copy of this NFT</p>
        )}

        {status == "authenticated" ? (
          <div className="flex flex-row gap-2  py-2">
            <SongCreate
              mode={ModalMode.EDIT}
              song={song}
              albumId={song.albumId}
            />

            <ConfirmationModal
              headerMessage="Do you realy want to delete this?"
              actionButton={
                <button className="btn btn-warning btn-sm w-20">Delete</button>
              }
            >
              <button
                className="btn btn-warning btn-sm w-20"
                onClick={handleTrackDelete}
              >
                Delete
              </button>
            </ConfirmationModal>
            <div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setNewTrack(song)}
              >
                Play
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
