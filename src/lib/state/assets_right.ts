import { create } from "zustand";
import { AssetType } from "~/components/marketplace/market_right";

type AssetRightType = AssetType & { copies: number };

interface AssetRightState {
  open: boolean;
  currentData?: AssetRightType;
  setOpen: (value: boolean) => void;
  setData: (value?: AssetRightType) => void;
}

export const useAssetRightStore = create<AssetRightState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  setData: (currentData) => set({ currentData }),
}));
