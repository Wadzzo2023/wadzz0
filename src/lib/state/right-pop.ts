import { create } from "zustand";

interface PopUpState {
  open: boolean;

  setOpen: (value: boolean) => void;
}

export const usePopUpState = create<PopUpState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
