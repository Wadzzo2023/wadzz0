import { create } from "zustand";

export type TrackItemType = {
  thumbnail: string;
  artist: string;
  name: string;
  mediaUrl: string;
  code: string;
};

interface Track {
  isPlaying: boolean;
  song?: TrackItemType;
  setNewTrack: (song?: TrackItemType) => void;
  bottomVisiable: boolean;
  setBottomVisiable: (value: boolean) => void;
  setisPlaying: (value: boolean) => void;
}

export const usePlayerStore = create<Track>((set) => ({
  // song: themeSong,
  bottomVisiable: false,
  isPlaying: false,
  setNewTrack: (song?: TrackItemType) => set({ song: song }),
  setBottomVisiable(value) {
    set({ bottomVisiable: value });
  },
  setisPlaying: (value) => set({ isPlaying: value }),
}));
