import { CreatorPageAsset } from "@prisma/client";
import { create } from "zustand";

interface PageAssetRightState {
  open: boolean;
  currentData?: CreatorPageAsset;
  setOpen: (value: boolean) => void;
  setData: (value?: CreatorPageAsset) => void;
}

export const usePageAssetRightStore = create<PageAssetRightState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  setData: (currentData) => set({ currentData }),
}));
