import { create } from "zustand";
import { SubmissionAttachment, type Location, type LocationConsumer } from "@prisma/client";

export type ModalType =
  | "send assets"
  | "receive assets"
  | "add assets"
  | "map"
  | "copied"
  | "claim pin"
  | "nft create"
  | "share"
  | "upload file"
  | "edit bounty"
  | 'view attachment'

export interface ModalData {
  pinId?: number;
  recipientId?: string;
  amount?: string;
  asset_code?: string;
  long?: number;
  lat?: number;
  mapTitle?: string;
  mapDescription?: string | null;
  location?: Location;
  locationConsumer?: LocationConsumer;
  postUrl?: string | null;
  image?: string;
  bountyId?: number;
  attachment?: SubmissionAttachment[];
  submissionId?: number;
}

interface ModalStore {
  type: ModalType | null;
  data: ModalData;
  isOpen: boolean;
  isPinCopied: boolean;
  isAutoCollect: boolean;
  isPinCut: boolean;
  onOpen: (type: ModalType, data?: ModalData) => void;
  onClose: () => void;
  setIsPinCopied: (isPinCopied: boolean) => void;
  setIsPinCut: (isPinCut: boolean) => void;
  setIsAutoCollect: (isAutoCollect: boolean) => void;
  updateData: (data: ModalData) => void;
}

export const useModal = create<ModalStore>((set) => ({
  type: null,
  data: {},
  isOpen: false,
  isPinCopied: false,
  isAutoCollect: false,
  isPinCut: false,
  onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
  onClose: () => set({ type: null, isOpen: false }),
  setIsPinCopied: (isPinCopied) => set({ isPinCopied }),
  setIsPinCut: (isPinCut) => set({ isPinCut }),
  setIsAutoCollect: (isAutoCollect) => set({ isAutoCollect }),
  updateData: (data) => set({ data }),
}));
