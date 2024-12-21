import { create } from "zustand";
import { AssetRightType } from "./play/use-modal-store";


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
