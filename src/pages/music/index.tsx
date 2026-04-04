import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { getCookie } from "cookies-next";
import { useEffect, useState } from "react";
import { Music2 } from "lucide-react";

import { api } from "~/utils/api";
import AlbumSection from "~/components/music/album/section";
import CreatorTrack from "~/components/music/creator/track";
import TrackSection, { TrackSectionSkeleton } from "~/components/music/track/section";

export default function MusicPage() {
  const [layoutMode, setLayoutMode] = useState<"modern" | "legacy">("legacy");

  useEffect(() => {
    const storedMode = getCookie("wadzzo-layout-mode");
    if (storedMode === "modern" || storedMode === "legacy") {
      setLayoutMode(storedMode);
    }
  }, []);

  return (
    <>
      <Head>
        <title>MUSIC APP - Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {layoutMode === "modern" ? <ModernMusicView /> : <LegacyMusicView />}
    </>
  );
}

function ModernMusicView() {
  const albums = api.music.album.getAll.useQuery();
  const allSongs = api.music.song.getAllSong.useQuery();
  const mySongs = api.music.song.getUserBuyedSongs.useQuery();
  const creatorSongs = api.music.song.getCreatorPublicSong.useQuery();

  return (
    <div className="mx-auto min-h-screen w-full text-black md:w-[85vw]">
      <div className="space-y-10">
        <ModernSection title="Albums">
          {albums.isLoading ? (
            <AlbumSkeleton />
          ) : albums.data && albums.data.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {albums.data.map((album) => (
                <Link key={album.id} href={`/music/album/${album.id}`}>
                  <ModernMusicCard
                    title={album.name}
                    subtitle={album.creatorId ?? "Admin"}
                    image={album.coverImgUrl}
                    badge="ALBUM"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <SectionEmptyState
              title="No Albums Yet"
              description="Albums will appear here once creators publish them."
            />
          )}
        </ModernSection>

        <ModernSection title="Recently Added Songs">
          {allSongs.isLoading ? (
            <TrackSectionSkeleton header="Recently Added Songs" />
          ) : allSongs.data && allSongs.data.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {allSongs.data.map((song) => (
                <ModernMusicCard
                  key={song.id}
                  title={song.asset.name}
                  subtitle={song.artist}
                  image={song.asset.thumbnail}
                  badge="SONG"
                  priceText={`$${song.priceUSD.toFixed(2)}`}
                />
              ))}
            </div>
          ) : (
            <SectionEmptyState
              title="No Songs Yet"
              description="Recently added songs will show up here."
            />
          )}
        </ModernSection>

        <ModernSection title="Your Songs">
          {mySongs.isLoading ? (
            <TrackSectionSkeleton header="Your songs" />
          ) : mySongs.data && mySongs.data.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {mySongs.data.map((song) => (
                <ModernMusicCard
                  key={`owned-${song.id}`}
                  title={song.asset.name}
                  subtitle="Owned by you"
                  image={song.asset.thumbnail}
                  badge="OWNED"
                  priceText={`$${song.priceUSD.toFixed(2)}`}
                />
              ))}
            </div>
          ) : (
            <SectionEmptyState
              title="No Purchased Songs"
              description="Songs you own will appear in this section."
            />
          )}
        </ModernSection>

        <ModernSection title="Public Songs">
          {creatorSongs.isLoading ? (
            <TrackSectionSkeleton header="Public Songs" />
          ) : creatorSongs.data && creatorSongs.data.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {creatorSongs.data.map((song) => (
                <ModernMusicCard
                  key={`public-${song.id}`}
                  title={song.asset.name}
                  subtitle={song.artist}
                  image={song.asset.thumbnail}
                  badge="PUBLIC"
                  priceText={`$${song.priceUSD.toFixed(2)}`}
                />
              ))}
            </div>
          ) : (
            <SectionEmptyState
              title="No Public Songs"
              description="Creator public songs are not available right now."
            />
          )}
        </ModernSection>
      </div>
    </div>
  );
}

function LegacyMusicView() {
  const { data } = api.wallate.admin.checkAdmin.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="p-4">
        <div className="space-y-12">
          <AlbumsContainer />
          <AllSongs />
          <MySongs />
          <CreatorPublicSongs adminId={data?.id} />
        </div>
      </div>
    </div>
  );
}

function ModernSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-black/85 md:text-2xl">{title}</h2>
      {children}
    </section>
  );
}

function SectionEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-black/20 bg-white/70 px-4 py-8 text-center">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-muted">
        <Music2 className="h-5 w-5 text-black/70" />
      </div>
      <p className="text-sm font-semibold text-black/80">{title}</p>
      <p className="mt-1 text-xs text-black/60">{description}</p>
    </div>
  );
}

function ModernMusicCard({
  title,
  subtitle,
  image,
  badge,
  priceText,
}: {
  title: string;
  subtitle: string;
  image: string;
  badge: string;
  priceText?: string;
}) {
  return (
    <article className="group overflow-hidden rounded-[0.95rem] border border-[#ddd9d0] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
      <div className="relative aspect-[0.96] overflow-hidden rounded-t-[0.95rem] bg-[#d8c7bb]">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />
      </div>

      <div className="flex flex-col gap-2 px-4 pb-3.5 pt-3">
        <span className="inline-flex w-fit rounded-[2px] bg-[#f3f1ee] px-2 py-0.5 text-[0.64rem] font-medium text-black/60">
          {badge}
        </span>
        <h3 className="line-clamp-1 text-[0.98rem] font-semibold leading-tight text-black/90">{title}</h3>
        <p className="line-clamp-1 text-sm text-black/60">{subtitle}</p>
        {priceText ? <p className="text-sm font-medium text-black/75">{priceText}</p> : null}
      </div>
    </article>
  );
}

function AlbumsContainer() {
  const albums = api.music.album.getAll.useQuery();

  if (albums.data)
    return (
      <div>
        <h2 className="mb-4 text-2xl font-bold text-gray-800">Albums</h2>
        {albums.data.length > 0 ? (
          <AlbumSection albums={albums.data} />
        ) : (
          <SectionEmptyState
            title="No Albums Yet"
            description="Albums will appear here once creators publish them."
          />
        )}
      </div>
    );

  if (albums.isLoading) return <AlbumSkeleton />;
}

export function AlbumSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }, (_, i: number) => (
        <div key={i} className="aspect-square animate-pulse rounded-lg bg-gray-200" />
      ))}
    </div>
  );
}

function MySongs() {
  const mySongs = api.music.song.getUserBuyedSongs.useQuery();

  const header = "Your songs";

  if (mySongs.isLoading) return <TrackSectionSkeleton header={header} />;

  if (mySongs.data && mySongs.data.length > 0) {
    return <TrackSection songs={mySongs.data} header={header} playable />;
  }

  return (
    <div className="w-full">
      <h2 className="mb-4 text-2xl font-bold text-gray-800">{header}</h2>
      <SectionEmptyState
        title="No Purchased Songs"
        description="Songs you own will appear in this section."
      />
    </div>
  );
}

function CreatorPublicSongs({ adminId: _adminId }: { adminId?: string }) {
  const creatorSongs = api.music.song.getCreatorPublicSong.useQuery();

  const header = "Public Songs";

  if (creatorSongs.isLoading) return <TrackSectionSkeleton header={header} />;

  if (creatorSongs.data && creatorSongs.data.length > 0) {
    return (
      <div>
        <h2 className="mb-4 text-2xl font-bold text-gray-800">{header}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {creatorSongs.data.map((song, index: number) => (
            <CreatorTrack
              key={song.id}
              playable={true}
              item={song}
              index={index + 1}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="mb-4 text-2xl font-bold text-gray-800">{header}</h2>
      <SectionEmptyState
        title="No Public Songs"
        description="Creator public songs are not available right now."
      />
    </div>
  );
}

function AllSongs() {
  const allSongs = api.music.song.getAllSong.useQuery();
  const header = "Recently Added Songs";

  if (allSongs.isLoading) return <TrackSectionSkeleton header={header} />;

  if (allSongs.data && allSongs.data.length > 0) {
    return <TrackSection songs={allSongs.data} header={header} />;
  }

  return (
    <div className="w-full">
      <h2 className="mb-4 text-2xl font-bold text-gray-800">{header}</h2>
      <SectionEmptyState
        title="No Songs Yet"
        description="Recently added songs will show up here."
      />
    </div>
  );
}
