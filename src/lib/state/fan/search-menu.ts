import { create } from "zustand";

export enum SearchMenu {
  Post = "Post",
  Creator = "Creator",
  Asset = "Asset",
}

interface SearchMenuState {
  selectedMenu: SearchMenu;
  setSelectedMenu: (menu: SearchMenu) => void;
  searchString: string;
  setSearchString: (searchString: string) => void;
}

export const useSearchMenu = create<SearchMenuState>((set) => ({
  searchString: "",
  setSearchString: (searchString) => set({ searchString }),
  selectedMenu: SearchMenu.Post,
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),
}));
