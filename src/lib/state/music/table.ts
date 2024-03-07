import { create } from "zustand";

interface Table {
  activeRow?: number;
  setActiveRow: (row: number) => void;
}

export const useTableStore = create<Table>((set) => ({
  setActiveRow: (row: number) => set({ activeRow: row }),
}));
