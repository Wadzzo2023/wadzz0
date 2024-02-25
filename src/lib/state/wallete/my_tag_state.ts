import { create } from "zustand";

interface MyTagStateType {
  isOpen: boolean;
  setIsOpen: (mode: boolean) => void;
}

export const useMyTagStore = create<MyTagStateType>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen: boolean) => set({ isOpen }),
}));
