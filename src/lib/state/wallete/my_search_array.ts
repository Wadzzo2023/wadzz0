import { create } from "zustand";

interface MySearchArrayState {
  value: string[];
  setValue: (value: string[]) => void;
}

export const useMySearchArrayStore = create<MySearchArrayState>((set) => ({
  value: [],
  setValue: (value) => set({ value }),
}));
