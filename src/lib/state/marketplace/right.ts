import { create } from "zustand";
import { MarketAssetType } from "../play/use-modal-store";

export interface MarketRightState {
  open: boolean;
  currentData?: MarketAssetType;
  setOpen: (value: boolean) => void;
  setData: (value?: MarketAssetType) => void;
}

export const useMarketRightStore = create<MarketRightState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  setData: (currentData) => set({ currentData }),
}));
