import { create } from "zustand";

export enum AssetMenu {
  SubscriptionAsset = "Subscription",
  Assets = "Assets",
}

interface AssetMenuState {
  selectedMenu: AssetMenu;
  setSelectedMenu: (menu: AssetMenu) => void;
}

export const useAssetMenu = create<AssetMenuState>((set) => ({
  selectedMenu: AssetMenu.SubscriptionAsset,
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),
}));
