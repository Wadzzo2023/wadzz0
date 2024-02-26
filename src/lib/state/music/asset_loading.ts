import { create } from "zustand";

interface AssetLoadingState {
  loading: boolean;
  setLoading: (value: boolean) => void;
}

export const useAssetLoadingStore = create<AssetLoadingState>((set) => ({
  loading: false,
  setLoading: (open) => set({ loading: open }),
}));
