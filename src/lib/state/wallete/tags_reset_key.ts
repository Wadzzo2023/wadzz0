import { create } from "zustand";

interface TagsResetKeyState {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
}

export const useTagsResetKeyStore = create<TagsResetKeyState>((set, get) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () =>
    set({
      open: !get().open,
    }),
}));
