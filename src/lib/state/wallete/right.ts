import { create } from "zustand";
import { AdminAsset } from "@prisma/client";

interface RightState {
  open: boolean;
  currentData?: AdminAsset;
  setOpen: (value: boolean) => void;
  setData: (value: AdminAsset) => void;
}

export const useRightStore = create<RightState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  setData: (currentData) => set({ currentData }),
}));
