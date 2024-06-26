import { create } from "zustand";

export enum CreatorMenu {
  Posts = "Posts",
  Membership = "Membership",
  // Shop = "Store",
}

interface CreatorState {
  selectedMenu: CreatorMenu;
  setSelectedMenu: (menu: CreatorMenu) => void;
}

export const useCreator = create<CreatorState>((set) => ({
  selectedMenu: CreatorMenu.Posts,
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),
}));
