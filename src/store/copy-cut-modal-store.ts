import { create } from "zustand";

interface CopyCutModalState {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export const useCopyCutModalStore = create<CopyCutModalState>((set) => ({
  isOpen: false,
  setIsOpen: (value) => set({ isOpen: value }),
}));
