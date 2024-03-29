import AlbumCover from "~/components/music/album/cover";
import SongList from "~/components/music/album/table";
import SongCreate from "~/components/music/modal/song_create";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  ConnectWalletButton,
  useConnectWalletStateStore,
} from "package/connect_wallet";
import log from "~/lib/logger/logger";
import { api } from "~/utils/api";
import Alert from "~/components/ui/alert";
import { AlbumSkeleton } from "..";

export default function AlbumPageWrapper() {
  const router = useRouter();
  const albumId = router.query.album;
  if (typeof albumId == "string") {
    return (
      <div className="p-4">
        <AlbumPage albumId={Number(albumId)} />
      </div>
    );
  } else {
    log.info("albumId", albumId);
    log.info("query: ", router.query);
    return (
      <div>
        <p> Loading to get albumId </p>
      </div>
    );
  }
}
export function AlbumPage({ albumId }: { albumId: number }) {
  const { status } = useSession();

  const album = api.music.album.getById.useQuery({ albumId });

  const logicalRender = () => {
    if (status === "authenticated" && album.data) {
      return (
        <>
          <AdminCreateSong albumId={albumId} />
          {album.data.songs.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold">Songs</h3>
              <SongList albumId={albumId} songs={album.data.songs} />
            </div>
          )}
        </>
      );
    } else {
      return <ConnectWalletButton />;
    }
  };

  if (album.isLoading) return <AlbumSkeleton />;

  if (album.data && album.data.songs) {
    return (
      <div className="">
        <AlbumCover album={album.data} songNumber={album.data.songs.length} />
        {logicalRender()}
      </div>
    );
  } else {
    return (
      <div className="mt-10">
        <Alert type="info" content="This Album does not exist" />
      </div>
    );
  }

  if (album.isError)
    return (
      <div className="mt-10">
        <Alert type="info" content="There something wrong" />
      </div>
    );
}

function AdminCreateSong({ albumId }: { albumId: number }) {
  const admin = api.wallate.admin.checkAdmin.useQuery();

  if (admin.isLoading) return <ButtonSkeleton />;

  if (admin.data) return <SongCreate albumId={albumId} />;
}

export function ButtonSkeleton() {
  return <div className="btn skeleton " />;
}
