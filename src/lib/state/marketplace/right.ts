import { create } from "zustand";
import type { AssetType } from "../interfaces";
import { NFT } from "../types/dbTypes";
import { MarketNFT } from "~/server/api/routers/marketplace";

interface RightState {
  open: boolean;
  currentData?: MarketNFT;
  setOpen: (value: boolean) => void;
  setRightData: (value?: MarketNFT) => void;
}

export const useRightStore = create<RightState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  setRightData: (currentData) => set({ currentData }),
}));
