import { create } from "zustand";
import { Song } from "../types/dbTypes";
import { OfflineSongs } from "../firebase/offiledb";

interface Table {
  activeRow?: number;
  setActiveRow: (row: number) => void;
}

export const useTableStore = create<Table>((set) => ({
  setActiveRow: (row: number) => set({ activeRow: row }),
}));
