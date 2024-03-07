import { PlayerSongCover } from "./player/player_song_cover";
import AudioPlayer from "react-h5-audio-player";
import TrackSection from "./track/section";
import { usePlayerStore } from "~/lib/state/music/track";
import { api } from "~/utils/api";

export function MusicRightSide() {
  const trackUrlStore = usePlayerStore();

  return (
    <div className="flex w-96 flex-col gap-y-2 bg-base-300">
      <RightSongs />

      <div className="flex flex-1 flex-col justify-between rounded bg-base-100">
        <h3 className="p-2 text-2xl font-bold">Now playing</h3>
        <div className="flex flex-1 flex-col justify-end rounded-lg bg-base-200">
          <div className=" flex  w-full flex-1">
            <PlayerSongCover song={trackUrlStore.song} />
          </div>
          <div className="">
            <AudioPlayer
              // autoPlay={false}
              src={
                "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
              }
              volume={0.3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function RightSongs() {
  return (
    <div className="flex-1 rounded bg-base-100 pl-2">
      <TrackSection header="Playable songs" />
    </div>
  );
}
