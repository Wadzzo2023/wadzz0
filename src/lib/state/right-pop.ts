import { create } from "zustand";

interface PopUpState {
  open: boolean;
  type?: string;
  setType: (value?: string) => void;

  setOpen: (value: boolean) => void;
}

export const usePopUpState = create<PopUpState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  setType: (value) => set({ type: value }),
}));
