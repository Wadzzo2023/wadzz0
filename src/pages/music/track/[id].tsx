import { useRouter } from "next/router";
import { useConnectWalletStateStore } from "package/connect_wallet";
import TrackCover from "~/components/music/track/cover";
import Alert from "~/components/ui/alert";
import { api } from "~/utils/api";

export default function TrackPageWrapper() {
  const router = useRouter();
  const songId = router.query.id;
  if (typeof songId == "string") {
    return <TrackPage songId={Number(songId)} />;
  } else {
    return (
      <div>
        <p> Loading to get albumId </p>
      </div>
    );
  }
}

export function TrackPage({ songId }: { songId: number }) {
  const { isAva, pubkey: pubKey } = useConnectWalletStateStore();
  const song = api.music.song.getAsong.useQuery({ songId });

  if (song.isLoading) return <span className="loading loading-spinner" />;

  if (song.isError)
    return <Alert type="error" content="Error while fetching song" />;

  if (song.data)
    return (
      <div>
        {/* <TrackCover song={song.data} /> */}
        {/* <div>
          {song && ablumSongs.length > 0 && (
            <div className="my-10">
              {isAva && (
                <>
                  <h3 className="text-2xl font-bold">
                    Song from the same album
                  </h3>
                  <SongList albumId={song.albumId} songs={ablumSongs} />
                </>
              )}
            </div>
          )}
        </div> */}
      </div>
    );
}
