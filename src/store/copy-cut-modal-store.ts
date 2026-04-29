import { create } from "zustand";

interface CopyCutModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export const useCopyCutModalStore = create<CopyCutModalProps>((set) => ({
    isOpen: false,
    setIsOpen: (isOpen) => set({ isOpen }),
}));
