import { create } from "zustand";

interface ModernDialogStore {
  isOpen: boolean;
  setIsOpen: (mode: boolean) => void;
}

export const useModernDialogStore = create<ModernDialogStore>((set) => ({
  isOpen: false,
  setIsOpen: (mode: boolean) => set({ isOpen: mode }),
}));
