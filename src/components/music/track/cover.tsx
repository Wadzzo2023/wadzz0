import { useSession } from "next-auth/react";
import { MouseEvent } from "react";
import AlbumCreate from "../modal/album_create";
import { ModalMode } from "../modal/modal_template";
import { api } from "~/utils/api";
import router, { useRouter } from "next/router";
import SongCreate from "../modal/song_create";
import Image from "next/image";
import Link from "next/link";
import ConfirmationModal from "../modal/confirmation";
import { AssetBadge } from "./asset_badge";
import clsx from "clsx";
import { Song } from "@prisma/client";

export default function TrackCover({
  song,
}: {
  song: Song & {
    asset: {
      code: string;
      thumbnail: string;
      name: string;
      mediaUrl: string;
      issuer: string;
      description: string;
    };
  };
}) {
  const { status } = useSession();
  // const mutation = api.song.deleteAsong.useMutation();

  // function handleTrackDelete() {
  //   mutation.mutate({ songId: song.id, albumId: song.albumId });
  //   router.back();
  // }

  return (
    <div className={clsx("flex  gap-2   py-5")}>
      <div className="bg-neutral-focus mr-4  h-48 w-48 flex-shrink-0 shadow-md">
        <Image
          src={song.asset.thumbnail}
          height={192}
          width={192}
          alt="Cover"
          className="mr-6 bg-base-300 object-cover"
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-3xl font-bold">{song.asset.name}</p>
        <Link href={`/album/${song.albumId}`}>
          <p className="text-sm font-bold hover:text-accent">
            Album: {song.albumId}
          </p>
        </Link>
        <p className="text-sm">Artist: {song.artist}</p>
        <div>
          <div>
            Asset: <AssetBadge asset={song.asset} />{" "}
            <div className="badge badge-md text-warning">{10}</div>
            {/* <span className="badge badge-accent">{song.songAsset.code}</span> */}
          </div>
          <p className="text-sm">Description: {song.asset.description}</p>
        </div>
        {/* {songsId.includes(song.id) && (
          <p className="text-sm">You have {10} copy of this NFT</p>
        )} */}

        {status == "authenticated" ? (
          <div className="flex flex-row gap-2  py-2">
            <SongCreate albumId={song.albumId} />

            <ConfirmationModal
              headerMessage="Do you realy want to delete this?"
              actionButton={
                <button className="btn btn-warning btn-sm w-20">Delete</button>
              }
            >
              <button
                className="btn btn-warning btn-sm w-20"
                // onClick={handleTrackDelete}
              >
                Delete
              </button>
            </ConfirmationModal>
            <div>
              <button
                className="btn btn-primary btn-sm"
                // onClick={() => setNewTrack(song)}
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
