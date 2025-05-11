import { create } from "zustand";

interface playerOpenState {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
}

export const usePlayerOpenStore = create<playerOpenState>((set, get) => ({
  open: true,
  setOpen: (open) => set({ open }),
  toggle: () =>
    set({
      open: !get().open,
    }),
}));
