import Head from "next/head";
import { api } from "~/utils/api";
import AlbumSection from "~/components/music/album/section";
import CreatorTrack from "~/components/music/creator/track";
import TrackSection, { TrackSectionSkeleton } from "~/components/music/track/section";
import { getAssetBalanceFromBalance } from "~/lib/stellar/marketplace/test/acc";

export default function Home() {
  return (
    <>
      <Head>
        <title>MUSIC APP - Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <body className="">
        <div className="min-h-screen bg-gray-50 text-gray-900 ">
          <div className="p-4 ">
            <h1 className="mb-8 text-4xl font-bold text-blue-600">Music App</h1>
            <div className="space-y-12 ">
              <AlbumsContainer />
              <AllSongs />
              <MySongs />
              <CreatorPublicSongs />
              <CreatorMarketSongs />
            </div>
          </div>
        </div>
      </body>
    </>
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

function CreatorPublicSongs() {
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
              item={
                {
                  ...song,
                  artist: song.creatorId?.substring(0, 4) ?? "creator",
                }
              }
              index={index + 1}
            />
          ))}
        </div>
      </div>
    );
  }
}

function CreatorMarketSongs() {
  const creatorSongs = api.music.song.getCreatorMarketSong.useQuery();
  const accBalances = api.wallate.acc.getUserPubAssetBallances.useQuery();

  const header = "Creators Market Songs";

  if (creatorSongs.isLoading) return <TrackSectionSkeleton header={header} />;

  if (creatorSongs.data && creatorSongs.data.length > 0) {
    return (
      <div>
        <h2 className="mb-4 text-2xl font-bold text-gray-800">{header}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {creatorSongs.data.map((marketItem, index: number) => {
            console.log("marketItem", marketItem);
            if (marketItem.asset.tier) {
              const bal = getAssetBalanceFromBalance({
                balances: accBalances.data,
                code: marketItem.asset.code,
                issuer: marketItem.asset.issuer,
              });
              if (marketItem.asset.tier.price <= bal) {
                return (
                  <CreatorTrack
                    key={marketItem.id}
                    playable={true}
                    item={{
                      ...marketItem.asset,
                      artist: marketItem.asset.creatorId?.substring(0, 4) ?? "creator",
                    }}
                    index={index + 1}
                  />
                );
              } else {
                return (
                  <CreatorTrack
                    key={marketItem.id}
                    item={{
                      ...marketItem.asset,
                      artist: marketItem.asset.creatorId?.substring(0, 4) ?? "creator",
                    }}

                    index={index + 1}
                  />
                );
              }
            }
          })}
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
