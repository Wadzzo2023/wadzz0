import { create } from "zustand";

export enum BountyTabMenu {
    Bounty = "Create Bounty",
    BountyList = "All Bounty",
}

interface BountyTabState {
    selectedMenu: BountyTabMenu;
    setSelectedMenu: (menu: BountyTabMenu) => void;
}

export const useBountyTabState = create<BountyTabState>((set) => ({
    selectedMenu: BountyTabMenu.Bounty,
    setSelectedMenu: (menu) => set({ selectedMenu: menu }),
}));
