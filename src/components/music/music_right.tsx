import { PlayerSongCover } from "./player/player_song_cover";
import AudioPlayer from "react-h5-audio-player";
import TrackSection from "./track/section";
import { usePlayerStore } from "~/lib/state/music/track";
import { api } from "~/utils/api";

export function MusicRightSide() {
  const { song, isPlaying, setisPlaying } = usePlayerStore();

  return (
    <div className="flex h-full flex-col gap-2 bg-base-200/50 p-2">
      <RightSongs />

      <div className=" flex flex-1 rounded-xl border-4 border-base-100  p-2">
        <div className="flex flex-1 flex-col justify-between rounded bg-base-100">
          <h3 className="p-2 text-2xl font-bold">Now playing</h3>
          <div className="flex flex-1 flex-col justify-end rounded-lg bg-base-200">
            <div className=" flex  w-full flex-1">
              <PlayerSongCover song={song} />
            </div>
            {/* <div className="">
              <AudioPlayer
                // autoPlay={false}
                src={
                  song
                    ? song.asset.mediaUrl
                    : "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                }
                volume={0.3}
                // onPlay={(e) => setisPlaying(true)}
                // onPause={(e) => setisPlaying(false)}
              />
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}

function RightSongs() {
  const songs = api.music.song.getUserBuyedSongs.useQuery();

  if (songs.isLoading)
    return (
      <div className=" flex-1 rounded-xl border-4 border-base-100 bg-base-200/80 p-2">
        <h3 className="py-2 text-2xl font-bold">Playable songs</h3>
        <div className="skeleton my-2 h-10 w-full" />
        <div className="skeleton h-10 w-full" />
      </div>
    );

  if (songs.data)
    return (
      <div className=" flex-1 rounded-xl border-4 border-base-100  p-2">
        <TrackSection songs={songs.data} header="Playable songs" playable />
      </div>
    );
}
