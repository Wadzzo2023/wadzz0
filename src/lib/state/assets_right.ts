import { create } from "zustand";
import { AssetType } from "~/components/marketplace/market_right";

interface AssetRightState {
  open: boolean;
  currentData?: AssetType;
  setOpen: (value: boolean) => void;
  setData: (value?: AssetType) => void;
}

export const useAssetRightStore = create<AssetRightState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  setData: (currentData) => set({ currentData }),
}));
