import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { ConnectWalletButton } from "package/connect_wallet";
import SongList from "~/components/music/album/table";
import Alert from "~/components/ui/alert";
import log from "~/lib/logger/logger";
import { api } from "~/utils/api";
import { AlbumSkeleton } from "..";
import Image from "next/image";
import { format } from "date-fns";
import { addrShort } from "~/utils/utils";
import Link from "next/link";
import { Clock3, Disc3 } from "lucide-react";

export default function AlbumPageWrapper() {
  const router = useRouter();
  const albumId = router.query.album;
  if (typeof albumId == "string") {
    return (
      <div className="mx-auto min-h-screen w-full px-4 pb-24 pt-6 md:w-[85vw] md:px-0">
        <AlbumPage albumId={Number(albumId)} />
      </div>
    );
  }

  log.info("albumId", albumId);
  log.info("query: ", router.query);
  return (
    <div>
      <p> Loading to get albumId </p>
    </div>
  );
}

export function AlbumPage({ albumId }: { albumId: number }) {
  const { status } = useSession();
  const album = api.music.album.getById.useQuery({ albumId });

  const logicalRender = () => {
    if (status === "authenticated" && album.data) {
      return (
        <>
          {album.data.songs.length === 0 && (
            <div className="mt-10">
              <Alert type="info" content="This Album does not have any songs" />
            </div>
          )}
          {album.data.songs.length > 0 && (
            <div className="mt-7">
              <SongList albumId={albumId} songs={album.data.songs} />
            </div>
          )}
        </>
      );
    }

    return <ConnectWalletButton />;
  };

  if (album.isLoading) return <AlbumSkeleton />;

  if (album.data?.songs) {
    const creatorLabel = album.data.creatorId
      ? addrShort(album.data.creatorId, 6)
      : "Admin";
    const songCountLabel =
      album.data.songs.length <= 1
        ? `${album.data.songs.length} Song`
        : `${album.data.songs.length} Songs`;

    return (
      <div className="flex w-full flex-col gap-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative h-44 w-44 shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_16px_40px_-28px_rgba(15,23,42,0.5)] md:h-52 md:w-52">
                <Image
                  src={album.data.coverImgUrl ?? "/images/logo.png"}
                  alt={`${album.data.name} album cover`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex min-h-[176px] max-w-2xl flex-col justify-between gap-3">
                <div className="space-y-2">
                  <h1 className="text-lg font-semibold tracking-tight text-[#0f172a] md:text-2xl">
                    {album.data.name}
                  </h1>
                  {album.data.creatorId ? (
                    <Link
                      href={`/fans/creator/${album.data.creatorId}`}
                      className="inline-flex items-center text-base font-semibold text-[#2563eb] transition-colors hover:text-[#1d4ed8]"
                    >
                      {creatorLabel}
                    </Link>
                  ) : (
                    <p className="text-base font-semibold text-[#0f172a]">{creatorLabel}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#334155]">
                    <span className="inline-flex items-center gap-1.5">
                      <Disc3 className="h-4 w-4" />
                      {songCountLabel}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4" />
                      Album
                    </span>
                    <span>
                      {album.data.createdAt
                        ? format(new Date(album.data.createdAt), "MMMM dd, yyyy")
                        : "Unknown Release Date"}
                    </span>
                  </div>
                  {album.data.description ? (
                    <p className="line-clamp-3 max-w-2xl text-sm leading-6 text-[#475569]">
                      {album.data.description}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        {logicalRender()}
      </div>
    );
  }

  if (album.isError) {
    return (
      <div className="mt-10">
        <Alert type="info" content="There something wrong" />
      </div>
    );
  }

  return (
    <div className="mt-10">
      <Alert type="info" content="This Album does not exist" />
    </div>
  );
}

export function ButtonSkeleton() {
  return <div className="btn skeleton" />;
}
