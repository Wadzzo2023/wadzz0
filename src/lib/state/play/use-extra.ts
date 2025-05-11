import { create } from "zustand";


export interface ExtraData {
    userView?: boolean;
}
interface ExtraStore {
    data: ExtraData;
    setData: (data: ExtraData) => void;
}

export const useExtraData = create<ExtraStore>((set) => ({
    data: {
        userView: false,
    },
    setData: (data: ExtraData) => set({ data }),
}));
