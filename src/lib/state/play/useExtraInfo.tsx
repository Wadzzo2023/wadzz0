import { create } from "zustand";

type userLocationType = {
  latitude: number;
  longitude: number;
};
export interface ExtraData {
  useCurrentLocation?: userLocationType;
}

interface ExtraStore {
  data: ExtraData;
  setData: (data: ExtraData) => void;
}

export const useExtraInfo = create<ExtraStore>((set) => ({
  data: {},
  setData: (data: ExtraData) => set({ data }),
}));
