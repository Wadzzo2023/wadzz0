import { create } from "zustand";

export enum MarketMenu {
  Wallate = "Bandcoin",
  Music = "Music",
  Subscription = "Subscription",
  FanAsset = "Fan Asset",
}

interface MarketMenurState {
  selectedMenu: MarketMenu;
  setSelectedMenu: (menu: MarketMenu) => void;
}

export const useMarketMenu = create<MarketMenurState>((set) => ({
  selectedMenu: MarketMenu.Wallate,
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),
}));
