import { create } from "zustand";

export interface AccountActionData {
  mode: boolean;
  brandMode: boolean;
}

interface AccountActionStore {
  data: AccountActionData;
  setData: (data: AccountActionData) => void;
}

export const useAccountAction = create<AccountActionStore>((set) => ({
  data: {
    mode: true,
    brandMode: true,
  },
  setData: (data: AccountActionData) => set({ data }),
}));
