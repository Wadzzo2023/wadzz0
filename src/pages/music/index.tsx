import Head from "next/head";
import AlbumSection from "~/components/music/album/section";
import CreatorTrack from "~/components/music/creator/track";
import TrackSection, {
  TrackSectionSkeleton,
} from "~/components/music/track/section";
import { api } from "~/utils/api";

export default function Home() {
  return (
    <>
      <Head>
        <title>MUSIC APP - Home</title>
        {/* <meta name="description" content={env.NEXT_PUBLIC_DESC} /> */}
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col gap-5 p-4">
        <AlbumsContainer />

        <AllSongs />
        <MySongs />

        <CreatorSongs />

        {/* <BottonPlayer /> */}
        {/* <div className="h-60"></div> */}
      </div>
    </>
  );
}

function AlbumsContainer() {
  const albums = api.music.album.getAll.useQuery();

  if (albums.data)
    return (
      <div>
        <h3 className="pb-4 text-2xl font-bold">ALBUMS</h3>
        <AlbumSection albums={albums.data} />
      </div>
    );

  if (albums.isLoading) return <AlbumSkeleton />;
}

export function AlbumSkeleton() {
  return (
    <div>
      <div className="skeleton h-40 w-40" />
    </div>
  );
}

function MySongs() {
  const mySongs = api.music.song.getUserBuyedSongs.useQuery();

  const header = "Your songs";

  if (mySongs.isLoading) return <TrackSectionSkeleton header={header} />;

  if (mySongs.data && mySongs.data.length > 0) {
    return (
      <div className="py-4">
        <TrackSection songs={mySongs.data} header={header} playable />
      </div>
    );
  }
}

function CreatorSongs() {
  const creatorSongs = api.music.song.getCreatorSongs.useQuery();

  const header = "Your songs";

  if (creatorSongs.isLoading) return <TrackSectionSkeleton header={header} />;

  if (creatorSongs.data && creatorSongs.data.length > 0) {
    return (
      <div className="py-4">
        {/* <TrackSection songs={creatorSongs.data} header={header} playable /> */}
        {creatorSongs.data.map((song) => (
          <CreatorTrack
            key={song.id}
            artist="artis"
            code={song.code}
            thumbnail={song.thumbnail}
          />
        ))}
      </div>
    );
  }
}

function AllSongs() {
  const allSongs = api.music.song.getAllSong.useQuery();

  const header = "Recently Added Songs";

  if (allSongs.isLoading) return <TrackSectionSkeleton header={header} />;

  if (allSongs.data && allSongs.data.length > 0) {
    return (
      <div className="py-4">
        <TrackSection songs={allSongs.data} header={header} />
      </div>
    );
  }
}
