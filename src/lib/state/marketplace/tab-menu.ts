import { create } from "zustand";

export enum MarketMenu {
  Wallate = "Bandcoin Curated",
  Music = "Music",
  FanAsset = "Fan Asset",
  Trade = "Trade",
}

interface MarketMenurState {
  selectedMenu: MarketMenu;
  setSelectedMenu: (menu: MarketMenu) => void;
}

export const useMarketMenu = create<MarketMenurState>((set) => ({
  selectedMenu: MarketMenu.Wallate,
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),
}));
