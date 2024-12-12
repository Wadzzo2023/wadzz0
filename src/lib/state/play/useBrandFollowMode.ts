import { create } from "zustand";



interface BrandFollowModeStore {
    data: boolean;
    setData: (data: boolean) => void;
}

export const useBrandFollowMode = create<BrandFollowModeStore>((set) => ({
    data: true,
    setData: (data: boolean) => set({ data }),
}));
