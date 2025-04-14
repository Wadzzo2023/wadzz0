import { create } from "zustand";

export enum SettingsMenu {
  Basic = "My Profile",
  // Membership = "Memberships",
}

interface SettingsMenuState {
  selectedMenu: SettingsMenu;
  setSelectedMenu: (menu: SettingsMenu) => void;
}

export const useSettingsMenu = create<SettingsMenuState>((set) => ({
  selectedMenu: SettingsMenu.Basic,
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),
}));
