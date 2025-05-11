import { create } from "zustand";

export enum Mode {
  User = "User",
  Creator = "Creator",
}

interface ModeState {
  selectedMenu: Mode;
  getAnotherMenu: () => Mode;
  setSelectedMenu: (menu: Mode) => void;
  toggleSelectedMenu: () => void;
}

export const useMode = create<ModeState>((set, get) => ({
  selectedMenu: Mode.User,

  getAnotherMenu: () =>
    get().selectedMenu === Mode.User ? Mode.Creator : Mode.User,
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),
  toggleSelectedMenu: () =>
    set((state) => ({
      selectedMenu: state.selectedMenu === Mode.User ? Mode.Creator : Mode.User,
    })),
}));
