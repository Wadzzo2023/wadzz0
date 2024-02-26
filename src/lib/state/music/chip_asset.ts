import { create } from "zustand";
import type { AssetType } from "../interfaces";

interface SelectedAsset {
  asset?: string;
  setAsset: (assetWithIssuer?: string) => void;
}

export const useChipAssetStore = create<SelectedAsset>((set) => ({
  setAsset: (assetWithIssuer) => set({ asset: assetWithIssuer }),
}));
