import { create } from "zustand";
import { ConsumedLocation } from "@app/types/CollectionTypes";

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
