import { create } from "zustand";

export enum AssetMenu {
  Assets = "Assets",
  SubscriptionAsset = "Subscription",
}

interface AssetMenuState {
  selectedMenu: AssetMenu;
  setSelectedMenu: (menu: AssetMenu) => void;
}

export const useAssetMenu = create<AssetMenuState>((set) => ({
  selectedMenu: AssetMenu.Assets,
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),
}));
