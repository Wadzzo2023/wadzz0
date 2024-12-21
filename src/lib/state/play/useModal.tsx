import { create } from "zustand";
import { Bounty } from "~/types/game/bounty";
import { ConsumedLocation } from "~/types/game/location";

export type ModalType =
  | "Delete"
  | "LocationInformation"
  | "JoinBounty"
  | "NearbyPin";

export interface ModalData {
  collectionId?: string;
  collectionName?: string;
  Collection?: ConsumedLocation;
  userCurrentBalance?: number;
  balance?: number;
  bounty?: Bounty;
}

interface ModalStore {
  type: ModalType | null;
  data: ModalData;
  isOpen: boolean;

  onOpen: (type: ModalType, data?: ModalData) => void;
  onClose: () => void;
}

export const useModal = create<ModalStore>((set) => ({
  type: null,
  data: {},
  isOpen: false,
  onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
  onClose: () => set({ type: null, isOpen: false }),
}));
