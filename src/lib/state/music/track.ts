import { create } from "zustand";
import { SongItemType } from "~/components/music/track/music_item";

interface Track {
  isPlaying: boolean;
  song?: SongItemType;
  setNewTrack: (song?: SongItemType) => void;
  bottomVisiable: boolean;
  setBottomVisiable: (value: boolean) => void;
  setisPlaying: (value: boolean) => void;
}

export const usePlayerStore = create<Track>((set) => ({
  // song: themeSong,
  bottomVisiable: false,
  isPlaying: false,
  setNewTrack: (song?: SongItemType) => set({ song: song }),
  setBottomVisiable(value) {
    set({ bottomVisiable: value });
  },
  setisPlaying: (value) => set({ isPlaying: value }),
}));
