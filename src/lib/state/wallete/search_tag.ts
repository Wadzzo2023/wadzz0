import { create } from "zustand";

export interface SearchTagState {
  queryParams: string;
  name: string;
  value: string;
  setData?: (value: SearchTagState) => void;
  reset?: () => void;
}

export const useSearchTagStore = create<SearchTagState>((set) => ({
  queryParams: "",
  name: "All",
  value: "",
  setData: (data) => set({ ...data }),
  reset: () => set({
    queryParams: "",
  name: "All",
  value: "",
  })
}));
