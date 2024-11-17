import { create } from "zustand";

export enum BrandMode {
  "GENERAL",
  "FOLLOW",
}

export interface AccountActionData {
  mode?: boolean;
  brandMode?: BrandMode;
}

interface AccountActionStore {
  data: AccountActionData;
  setData: (data: AccountActionData) => void;
}

export const useAccountAction = create<AccountActionStore>((set) => ({
  data: {
    mode: true,
    brandMode: BrandMode.GENERAL,
  },
  setData: (data: AccountActionData) => set({ data }),
}));
