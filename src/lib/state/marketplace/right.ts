import { create } from "zustand";
import { AdminAssetWithTag } from "~/components/wallete/asset";

interface MarketRightState {
  open: boolean;
  currentData?: AdminAssetWithTag;
  setOpen: (value: boolean) => void;
  setData: (value: AdminAssetWithTag) => void;
}

export const useMarketRightStore = create<MarketRightState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  setData: (currentData) => set({ currentData }),
}));
