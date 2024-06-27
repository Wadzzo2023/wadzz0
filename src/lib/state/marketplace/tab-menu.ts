import { create } from "zustand";

export enum MarketMenu {
  Wallate = "Wadzzo Curated",
  Music = "Music",
  FanAsset = "Brand Asset",
}

interface MarketMenurState {
  selectedMenu: MarketMenu;
  setSelectedMenu: (menu: MarketMenu) => void;
}

export const useMarketMenu = create<MarketMenurState>((set) => ({
  selectedMenu: MarketMenu.Wallate,
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),
}));
