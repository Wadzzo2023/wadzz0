import { create } from "zustand";
import { MarketAssetType } from "~/components/marketplace/market_right";

interface viewAssetModal {
  asset?: MarketAssetType;
  setAsset: (asset: MarketAssetType) => void;
  modalRef?: React.RefObject<HTMLDialogElement>;
}

export const useSettingsMenu = create<viewAssetModal>((set) => ({
  setAsset: (asset) => set({ asset }),
}));
