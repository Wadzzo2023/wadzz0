import { create } from "zustand";

import { Bounty } from "@app/types/BountyTypes";

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
