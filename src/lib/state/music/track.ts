import { create } from "zustand";
import { SongItem } from "~/components/music/track/music_item";

interface Track {
  song?: SongItem;
  setNewTrack: (song: SongItem) => void;
}

export const usePlayerStore = create<Track>((set) => ({
  // song: themeSong,
  setNewTrack: (song: SongItem) => set({ song: song }),
}));
