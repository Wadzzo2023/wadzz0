import { create } from "zustand";
import { ConsumedLocation } from "~/types/game/location";

export interface PinData {
  nearbyPins?: ConsumedLocation[];
  singleAR?: boolean;
}

interface PinStore {
  data: PinData;
  setData: (data: PinData) => void;
}

export const useNearByPin = create<PinStore>((set) => ({
  data: {
    nearbyPins: [],
    singleAR: false,
  },
  setData: (data: PinData) => set({ data }),
}));
