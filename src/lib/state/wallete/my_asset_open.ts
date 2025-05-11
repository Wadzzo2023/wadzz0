import { create } from "zustand";

interface MyAssetOpenState {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
}

export const useMyAssetOpenStore = create<MyAssetOpenState>((set, get) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () =>
    set({
      open: !get().open,
    }),
}));
