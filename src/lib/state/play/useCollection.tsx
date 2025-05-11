import { create } from "zustand";
import { ConsumedLocation } from "~/types/game/location";

export interface CollectionData {
  collections?: ConsumedLocation;
}

interface CollectionStore {
  data: CollectionData;
  setData: (data: CollectionData) => void;
}

export const useCollection = create<CollectionStore>((set) => ({
  data: {},
  setData: (data: CollectionData) => set({ data }),
}));
