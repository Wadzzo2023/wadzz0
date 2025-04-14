import { create } from "zustand";
import { env } from "~/env";
import { CREATOR_TERM } from "~/utils/term";

export const MarketMenu = {
  Wallet: `${env.NEXT_PUBLIC_ASSET_CODE} Curated`,
  Music: "Music",
  FanAsset: `${CREATOR_TERM} Tokens`,
  Trade: "Trade",
} as const;

type MarketMenuKeys = keyof typeof MarketMenu;

interface MarketMenuState {
  selectedMenu: MarketMenuKeys;
  setSelectedMenu: (menu: MarketMenuKeys) => void;
}

export const useMarketMenu = create<MarketMenuState>((set) => ({
  selectedMenu: "Wallet",
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),
}));
