import { create } from "zustand";
interface ContentWidth {
  width?: number;
  setWidth: (width: number) => void;
  height?: number;
  setHeight: (height: number) => void;
}

export const useContentWidthStore = create<ContentWidth>((set) => ({
  // height: window.innerHeight,
  setWidth: (width) => set({ width }),
  setHeight: (height) => set({ height }),
}));
