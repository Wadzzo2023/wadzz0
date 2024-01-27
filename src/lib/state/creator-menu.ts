import { create } from "zustand";

export enum CreatorMenu {
  Home = "Home",
  Posts = "Posts",
  Membership = "Membership",
  Shop = "Shop",
  About = "About",
}

interface CreatorState {
  selectedMenu: CreatorMenu;
  setSelectedMenu: (menu: CreatorMenu) => void;
}

export const useCreator = create<CreatorState>((set) => ({
  selectedMenu: CreatorMenu.Home,
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),
}));
