import { create } from "zustand";

export interface AnimationData {
    showWinnerAnimation?: boolean;
}

interface AnimationStore {
    data: AnimationData;
    setData: (data: AnimationData) => void;
}

export const useWinnerAnimation = create<AnimationStore>((set) => ({
    data: {
        showWinnerAnimation: false,
    },
    setData: (data: AnimationData) => set({ data }),
}));
