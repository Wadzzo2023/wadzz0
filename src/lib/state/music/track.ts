import { create } from "zustand";
import { Song } from "../types/dbTypes";
import { OfflineSongs } from "../firebase/offiledb";

const themeSong: Song = OfflineSongs[0]!;

interface Track {
  song?: Song;
  setNewTrack: (song: Song) => void;
}

export const usePlayerStore = create<Track>((set) => ({
  // song: themeSong,
  setNewTrack: (song: Song) => set({ song: song }),
}));
