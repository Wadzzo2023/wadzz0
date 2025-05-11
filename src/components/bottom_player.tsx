import { usePlayerStore } from "~/lib/state/music/track";
import { PlayerSongCover } from "./music/player/player_song_cover";
import AudioPlayer from "react-h5-audio-player";
import Image from "next/image";

export default function BottonPlayer() {
  const { song } = usePlayerStore();

  if (song)
    return (
      <div className="flex w-full  rounded-2xl bg-base-100 p-2 shadow-lg">
        {/* <div className="flex w-44">
            <PlayerSongCover song={song} />
          </div> */}
        <div className="flex-1  w-full rounded-3xl">
          <AudioPlayer className=" w-full"
            header={
              <div className="flex  items-center gap-2">
                <Image
                  src={song.thumbnail}
                  width={40}
                  height={40}
                  alt="music cover"
                />
                <div>
                  {" "}
                  {`${song.name}`} <br /> {`${song.artist}`}
                </div>
              </div>
            }
            defaultCurrentTime="00:01:00"
            autoPlay={true}
            src={song.mediaUrl}
            volume={0.3}
          />
        </div>
      </div>
    );
}
