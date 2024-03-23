import { create } from "zustand";
import { MarketAssetType } from "~/components/marketplace/market_right";

interface AssetRightState {
  open: boolean;
  currentData?: MarketAssetType;
  setOpen: (value: boolean) => void;
  setData: (value?: MarketAssetType) => void;
}

export const useAssetRightStore = create<AssetRightState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  setData: (currentData) => set({ currentData }),
}));
