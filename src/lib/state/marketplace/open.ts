import { create } from "zustand";

export enum NAVIGATION {
  SEARCH = "SEARCH",
  MYNFTS = "MYNFTS",
  MARKETPLACE = "MARKETPLACE",
}

interface OpenState {
  navPath: NAVIGATION;
  setNavPath: (navPath: NAVIGATION) => void;
}

export const useOpenStore = create<OpenState>((set) => ({
  navPath: NAVIGATION.MARKETPLACE,
  setNavPath(navPath) {
    set({ navPath });
  },
}));
