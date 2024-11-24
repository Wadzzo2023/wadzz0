import Head from "next/head";
import AlbumSection from "~/components/music/album/section";
import CreatorTrack from "~/components/music/creator/track";
import TrackSection, {
  TrackSectionSkeleton,
} from "~/components/music/track/section";
import { api } from "~/utils/api";
import { getAssetBalanceFromBalance } from "~/lib/stellar/marketplace/test/acc";
import BuyModal from "~/components/music/modal/buy_modal";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

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
        <CreatorPublicSongs />
        <CreatorMarketSongs />
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

function CreatorPublicSongs() {
  const creatorSongs = api.music.song.getCreatorPublicSong.useQuery();
  const admin = api.wallate.admin.checkAdmin.useQuery();

  const header = "Public Songs";

  if (creatorSongs.isLoading) return <TrackSectionSkeleton header={header} />;

  if (creatorSongs.data && creatorSongs.data.length > 0) {
    return (
      <div className="py-4">
        {/* <TrackSection songs={creatorSongs.data} header={header} playable /> */}
        <h3 className="py-2 text-2xl font-bold">{header}</h3>
        {creatorSongs.data.map((song) => {
          return (
            <div className="flex w-full " key={song.id}>
              <div className="w-full">
                <CreatorTrack
                  key={song.id}
                  // choose first 4 characters of the creator
                  playable={true}
                  item={{
                    ...song,
                    artist: song.creatorId?.substring(0, 4) ?? "creator",
                  }}
                />
              </div>
              {admin.data && <DeletePublicSong key={song.id} id={song.id} />}
            </div>
          );
        })}
      </div>
    );
  }
}

function DeletePublicSong({ id }: { id: number }) {
  const deletM = api.music.song.deleteCreatorPublicSong.useMutation({
    onSuccess(data, variables, context) {
      toast.success("Song deleted successfully");
    },
  });

  return (
    <button
      className="btn btn-primary"
      onClick={() =>
        deletM.mutate({
          songId: id,
        })
      }
    >
      {deletM.isLoading && <Loader2 className="animate animate-spin" />}
      Delete
    </button>
  );
}

function CreatorMarketSongs() {
  const creatorSongs = api.music.song.getCreatorMarketSong.useQuery();
  const accBalances = api.wallate.acc.getUserPubAssetBallances.useQuery();

  const header = "Creators Market Songs";

  if (creatorSongs.isLoading) return <TrackSectionSkeleton header={header} />;

  if (creatorSongs.data && creatorSongs.data.length > 0) {
    return (
      <div className="py-4">
        {/* <TrackSection songs={creatorSongs.data} header={header} playable /> */}
        <h3 className="py-2 text-2xl font-bold">{header}</h3>
        {creatorSongs.data.map((marketItem) => {
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
                    artist:
                      marketItem.asset.creatorId?.substring(0, 4) ?? "creator",
                  }}
                />
              );
            } else {
              return (
                <CreatorTrack
                  key={marketItem.id}
                  item={{
                    ...marketItem.asset,
                    artist:
                      marketItem.asset.creatorId?.substring(0, 4) ?? "creator",
                  }}
                  buyModal={
                    <BuyModal
                      item={marketItem.asset}
                      price={marketItem.price}
                      priceUSD={marketItem.priceUSD}
                      marketItemId={marketItem.id}
                      placerId={marketItem.placerId}
                    />
                  }
                />
              );
            }
          }
        })}
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
