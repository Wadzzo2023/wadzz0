import { PlayCircle, Heart } from "lucide-react";
import React from "react";
import { usePlayerStore } from "~/lib/states/track";
import { Song, SongPrivacy } from "~/lib/types/dbTypes";
import BuyModal from "../modal/buy_modal";
import { useSongStore } from "~/lib/states/songs";

export default function TrackButtonGroup({ song }: { song: Song }) {
  const songUrlStore = usePlayerStore();
  const mySong = useSongStore((state) => state.getUserSongs());
  const { userSongIds: songsId } = useSongStore();

  if (song.songAsset)
    return (
      <div className="flex gap-2">
        {mySong.some((s) => s.id == song.id) ||
        song.privacy == SongPrivacy.PUBLIC ? (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => songUrlStore.setNewTrack(song)}
          >
            Play
          </button>
        ) : (
          <div>
            {song.privacy == SongPrivacy.RESTRICTED && <BuyModal item={song} />}
          </div>
        )}
      </div>
    );
}
