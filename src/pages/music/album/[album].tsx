

import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { ConnectWalletButton } from "package/connect_wallet";
import SongList from "~/components/music/album/table";
import SongCreate from "~/components/music/modal/song_create";
import Alert from "~/components/ui/alert";
import log from "~/lib/logger/logger";
import { api } from "~/utils/api";
import { AlbumSkeleton } from "..";
import Image from "next/image";
import { format, set } from "date-fns";
import { addrShort } from "~/utils/utils";
import Link from "next/link";

export default function AlbumPageWrapper() {
  const router = useRouter();
  const albumId = router.query.album;
  if (typeof albumId == "string") {
    return (
      <div className="p-4 h-screen">
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
          {
            album.data.songs.length === 0 && (
              <div className="mt-10">
                <Alert type="info" content="This Album does not have any songs" />
              </div>
            )
          }
          {album.data.songs.length > 0 && (
            <div className="mt-8">
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

  if (album.data?.songs) {
    return (
      <div className="">
        <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6">
          <Image
            src={album.data.coverImgUrl ?? "/images/logo.png"}
            alt={`${album.data.name} album cover`}
            width={300}
            height={300}
            className="rounded-md shadow-lg"
          />
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold">{album.data.name}</h1>
            <p className="text-xl text-muted-foreground">{album.data.songs.length <= 1 ? `${album.data.songs.length} Song` : `${album.data.songs.length} Songs`}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Description • {album.data.description}
            </p>
            {
              album.data.creatorId && (
                <Link
                  href={`/fans/creator/${album.data.creatorId}`}
                > <p className="text-sm text-muted-foreground mt-2">
                    Creator • {addrShort(album.data.creatorId, 6)}
                  </p>
                </Link>
              )
            }
            <p className="text-sm text-muted-foreground mt-2">
              <p className="text-sm text-muted-foreground mt-2">
                Album • {album.data.createdAt ? format(new Date(album.data.createdAt), "MMMM dd, yyyy") : "Unknown Release Date"}
              </p>
            </p>
          </div>
        </div>



        {/* <AlbumCover album={album.data} songNumber={album.data.songs.length} /> */}
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
