import { create } from "zustand";

interface SearchOpenState {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
}

export const useSearchOpenStore = create<SearchOpenState>((set, get) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () =>
    set({
      open: !get().open,
    }),
}));
