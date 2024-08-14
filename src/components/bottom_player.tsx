import { usePlayerStore } from "~/lib/state/music/track";
import { PlayerSongCover } from "./music/player/player_song_cover";
import AudioPlayer from "react-h5-audio-player";

export default function BottonPlayer() {
  const { song } = usePlayerStore();

  if (song)
    return (
      <div className="">
        <div className="flex w-full flex-1  items-end  justify-end rounded-2xl bg-base-100 p-2 shadow-lg">
          <div className="flex w-40">
            <PlayerSongCover song={song} />
          </div>
          <div className="flex-1 rounded-3xl">
            <AudioPlayer
              defaultCurrentTime="00:01:00"
              autoPlay={true}
              src={song.mediaUrl}
              volume={0.3}
            />
          </div>
        </div>
      </div>
    );
}
