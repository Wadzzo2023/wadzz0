import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { getCookie } from "cookies-next";
import { useEffect, useState } from "react";
import type { Album, ItemPrivacy, MediaType } from "@prisma/client";

import { api } from "~/utils/api";
import AlbumSection from "~/components/music/album/section";
import CreatorTrack from "~/components/music/creator/track";
import TrackSection, { TrackSectionSkeleton } from "~/components/music/track/section";
import type { SongItemType } from "~/lib/state/play/use-modal-store";
import { cn } from "~/utils/utils";

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

type MockAsset = {
  id: number;
  name: string;
  description: string | null;
  limit: number | null;
  code: string;
  issuer: string;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnail: string;
  privacy: ItemPrivacy;
  creatorId: string | null;
  tierId: number | null;
};

const mockAlbums: Album[] = [
  {
    id: 9001,
    name: "Neon Afterglow",
    description: "Synth-pop and late-night live edits.",
    coverImgUrl: "https://placehold.co/900x900/png?text=Neon+Afterglow",
    creatorId: "creator_band_001",
    createdAt: new Date("2026-01-15T10:00:00.000Z"),
  },
  {
    id: 9002,
    name: "City Pulse",
    description: "High-energy crowd anthems.",
    coverImgUrl: "https://placehold.co/900x900/png?text=City+Pulse",
    creatorId: "creator_band_002",
    createdAt: new Date("2026-02-04T10:00:00.000Z"),
  },
  {
    id: 9003,
    name: "Studio Sessions",
    description: "Raw takes and acoustic sessions.",
    coverImgUrl: "https://placehold.co/900x900/png?text=Studio+Sessions",
    creatorId: "creator_band_003",
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
  },
];

const mockAssets: MockAsset[] = [
  {
    id: 8001,
    name: "Midnight Echoes",
    description: "Lead single",
    limit: 100,
    code: "MIDNIGHT_ECHOES",
    issuer: "MOCK_ISSUER_MUSIC",
    mediaType: "MUSIC",
    mediaUrl: "https://placehold.co/1200x1200/png?text=Midnight+Echoes+Audio",
    thumbnail: "https://placehold.co/700x700/png?text=Midnight+Echoes",
    privacy: "PUBLIC",
    creatorId: "creator_band_001",
    tierId: null,
  },
  {
    id: 8002,
    name: "Stage Lights Poster",
    description: "Live version",
    limit: 100,
    code: "STAGE_LIGHTS_POSTER",
    issuer: "MOCK_ISSUER_MUSIC",
    mediaType: "MUSIC",
    mediaUrl: "https://placehold.co/1200x1200/png?text=Stage+Lights+Audio",
    thumbnail: "https://placehold.co/700x700/png?text=Stage+Lights",
    privacy: "PUBLIC",
    creatorId: "creator_band_002",
    tierId: null,
  },
  {
    id: 8003,
    name: "Backstage Clip",
    description: "Alt mix",
    limit: 100,
    code: "BACKSTAGE_CLIP",
    issuer: "MOCK_ISSUER_MUSIC",
    mediaType: "MUSIC",
    mediaUrl: "https://placehold.co/1200x1200/png?text=Backstage+Clip+Audio",
    thumbnail: "https://placehold.co/700x700/png?text=Backstage+Clip",
    privacy: "PUBLIC",
    creatorId: "creator_band_003",
    tierId: null,
  },
];

const mockSongItems: SongItemType[] = [
  {
    id: 7001,
    artist: "Band A",
    assetId: 8001,
    creatorId: "creator_band_001",
    price: 25,
    priceUSD: 4.99,
    albumId: 9001,
    createdAt: new Date("2026-02-11T10:00:00.000Z"),
    asset: mockAssets[0]!,
  },
  {
    id: 7002,
    artist: "Band B",
    assetId: 8002,
    creatorId: "creator_band_002",
    price: 20,
    priceUSD: 3.99,
    albumId: 9002,
    createdAt: new Date("2026-02-18T10:00:00.000Z"),
    asset: mockAssets[1]!,
  },
  {
    id: 7003,
    artist: "Band C",
    assetId: 8003,
    creatorId: "creator_band_003",
    price: 22,
    priceUSD: 4.49,
    albumId: 9003,
    createdAt: new Date("2026-03-02T10:00:00.000Z"),
    asset: mockAssets[2]!,
  },
];

function ModernMusicView() {
  return (
    <div className="mx-auto min-h-screen w-full text-black md:w-[85vw]">
      <div className="space-y-10">
        <ModernSection title="Albums">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {mockAlbums.map((album) => (
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
        </ModernSection>

        <ModernSection title="Recently Added Songs">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {mockSongItems.map((song) => (
              <ModernMusicCard
                key={song.id}
                title={song.asset.name}
                subtitle={song.artist}
                image={song.asset.thumbnail}
                badge={`$${song.priceUSD.toFixed(2)}`}
              />
            ))}
          </div>
        </ModernSection>

        <ModernSection title="Your Songs">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {mockSongItems.map((song) => (
              <ModernMusicCard
                key={`owned-${song.id}`}
                title={song.asset.name}
                subtitle={`Owned by you`}
                image={song.asset.thumbnail}
                badge="OWNED"
              />
            ))}
          </div>
        </ModernSection>

        <ModernSection title="Public Songs">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {mockSongItems.map((song) => (
              <ModernMusicCard
                key={`public-${song.id}`}
                title={song.asset.name}
                subtitle={song.artist}
                image={song.asset.thumbnail}
                badge="PUBLIC"
              />
            ))}
          </div>
        </ModernSection>
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

function ModernMusicCard({
  title,
  subtitle,
  image,
  badge,
}: {
  title: string;
  subtitle: string;
  image: string;
  badge: string;
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
        <p className={cn("line-clamp-1 text-sm text-black/60")}>{subtitle}</p>
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
        <AlbumSection albums={albums.data} />
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
}

function AllSongs() {
  const allSongs = api.music.song.getAllSong.useQuery();
  const header = "Recently Added Songs";

  if (allSongs.isLoading) return <TrackSectionSkeleton header={header} />;

  if (allSongs.data && allSongs.data.length > 0) {
    return <TrackSection songs={allSongs.data} header={header} />;
  }
}
