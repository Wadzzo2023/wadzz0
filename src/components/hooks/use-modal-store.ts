import { create } from "zustand";

export type ModalType = "send assets" | "receive assets" | "add assets" | "map" | "copied";

interface ModalData {
    pinId?: number;
    recipientId?: string;
    amount?: string;
    asset_code?: string;
    long?: number;
    lat?: number;
}

interface ModalStore {
  type: ModalType | null;
  data: ModalData;
  isOpen: boolean;
  isPinCopied: boolean;
  onOpen: (type: ModalType, data?: ModalData) => void;
  onClose: () => void;
  setIsPinCopied: (isPinCopied: boolean) => void;
}

export const useModal = create<ModalStore>((set) => ({
  type: null,
  data: {},
  isOpen: false,
  isPinCopied: false,
  onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
  onClose: () => set({ type: null, isOpen: false }),
  setIsPinCopied: (isPinCopied) => set({ isPinCopied }),
}));
