import { create } from "zustand";

export enum AdminNavigation {
  // WALLET = "wallet",
  NFT = "nft",
  ALBUM = "album",
  ADMIN = "admin",
  PINS = "pins",
  COLLECTION_REPORTS = "pins-report",
  CREATORS = "creators",
  USERS = "users",
  BOUNTY = "bounty",
}

interface MarketMenurState {
  selectedMenu: AdminNavigation;
  setSelectedMenu: (menu: AdminNavigation) => void;
}

export const useAdminMenu = create<MarketMenurState>((set) => ({
  selectedMenu: AdminNavigation.NFT,
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),
}));
