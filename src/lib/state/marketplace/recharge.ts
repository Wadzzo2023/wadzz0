import { create } from "zustand";

interface OpenState {
  convertOpen: boolean;
  setOpen: (state: boolean) => void;
}

export const useRecharge = create<OpenState>((set) => ({
  convertOpen: false,
  setOpen(state) {
    set({ convertOpen: state });
  },
}));
