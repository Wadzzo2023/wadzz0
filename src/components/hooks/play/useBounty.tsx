import { Bounty } from "@prisma/client";
import { create } from "zustand";

export interface BountyData {
  item?: Bounty;
}

interface BountyStore {
  data: BountyData;
  setData: (data: BountyData) => void;
}

export const useBounty = create<BountyStore>((set) => ({
  data: {},
  setData: (data: BountyData) => set({ data }),
}));
