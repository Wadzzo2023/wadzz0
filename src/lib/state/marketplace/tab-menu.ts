import { create } from "zustand";
import { PLATFROM_ASSET } from "~/lib/stellar/fan/constant";

export enum MarketMenu {
  Wallate = "Admin",
  Music = "Music",
  FanAsset = "Band Asset",
}

interface MarketMenurState {
  selectedMenu: MarketMenu;
  setSelectedMenu: (menu: MarketMenu) => void;
}

export const useMarketMenu = create<MarketMenurState>((set) => ({
  selectedMenu: MarketMenu.Wallate,
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),
}));
