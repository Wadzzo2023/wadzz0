import { create } from "zustand";

export enum CreatorProfileMenu {
  Contents = "Contents",
  Shop = "Shop",
}

interface CreatorProfileState {
  selectedMenu: CreatorProfileMenu;
  setSelectedMenu: (menu: CreatorProfileMenu) => void;
}

export const useCreatorProfileMenu = create<CreatorProfileState>((set) => ({
  selectedMenu: CreatorProfileMenu.Contents,
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),
}));
