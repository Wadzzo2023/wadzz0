import { create } from "zustand";

export enum CreateMenu {
  Home = "Create",
  Posts = "Content",
}

interface CreateState {
  selectedMenu: CreateMenu;
  setSelectedMenu: (menu: CreateMenu) => void;
}

export const useCreateMenu = create<CreateState>((set) => ({
  selectedMenu: CreateMenu.Home,
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),
}));
