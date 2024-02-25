import { create } from "zustand";
import type { AssetType } from "../../wallate/interfaces";

interface RightState {
  open: boolean;
  currentData?: AssetType;
  setOpen: (value: boolean) => void;
  setData: (value: AssetType) => void;
}

export const useRightStore = create<RightState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  setData: (currentData) => set({ currentData }),
}));
