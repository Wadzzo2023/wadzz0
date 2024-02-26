import { Song } from "@prisma/client";
import { create } from "zustand";

interface Track {
  song?: Song;
  setNewTrack: (song: Song) => void;
}

export const usePlayerStore = create<Track>((set) => ({
  // song: themeSong,
  setNewTrack: (song: Song) => set({ song: song }),
}));
