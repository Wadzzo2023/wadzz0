import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AccountActionData {
  mode: boolean;
  brandMode: boolean;
}

interface AccountActionStore {
  data: AccountActionData;
  setData: (data: AccountActionData) => void;
}

export const useAccountAction = create<AccountActionStore>()(
  persist(
    (set) => ({
      data: {
        mode: true,
        brandMode: true,
      },
      setData: (data: AccountActionData) => set({ data }),
    }),
    {
      name: "account-action-storage", // Key to store in localStorage
    }
  )
);
