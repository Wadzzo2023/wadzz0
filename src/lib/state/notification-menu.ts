import { create } from "zustand";

export enum NotificationMenu {
  Creator = "Creator",
  User = "User",
}

interface NotificationMenuState {
  selectedMenu: NotificationMenu;
  setSelectedMenu: (menu: NotificationMenu) => void;
}

export const useNotificationMenu = create<NotificationMenuState>((set) => ({
  selectedMenu: NotificationMenu.Creator,
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),
}));
