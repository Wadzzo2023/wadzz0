import { create } from "zustand";
import { SongItemType } from "~/components/music/track/music_item";

interface Track {
  song?: SongItemType;
  setNewTrack: (song: SongItemType) => void;
}

export const usePlayerStore = create<Track>((set) => ({
  // song: themeSong,
  setNewTrack: (song: SongItemType) => set({ song: song }),
}));
