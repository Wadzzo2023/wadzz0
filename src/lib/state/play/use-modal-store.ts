import { create } from "zustand";
import {
  AdminAsset,
  Asset,
  ItemPrivacy,
  LocationGroup,
  MarketAsset,
  Song,
  SubmissionAttachment,
  type Location,
  type LocationConsumer,
} from "@prisma/client";

import { Horizon } from "@stellar/stellar-sdk";
export type AssetRightType = AssetType & { copies: number };

export type SongItemType = Song & { asset: AssetType };
export type AssetType = Omit<Asset, "issuerPrivate">;

export type MarketAssetType = MarketAsset & {
  asset: AssetType;
};
export type AdminAssetWithTag = AdminAsset & {
  tags: {
    tagName: string;
  }[];
};
export type collectedPinInfoType = {
  location: Location & {
    locationGroup: LocationGroup | null;
  };
};
export type Transaction = {
  source: string;
  successful: boolean;
  ledger_attr: number;
  sequence: string;
  maxFee: string | number;
  createdAt: string;
  memo: string | undefined;
  id: string;
  pagingToken: string;
  envelopeXdr: string;
  resultXdr: string;
  resultMetaXdr: string;
  signatures: string[];
  fee_charged: string | number;
  operations: Horizon.ServerApi.OperationRecord[];
};
export type CreatorConsumedPin = {
  id: string;
  startDate: Date;
  endDate: Date;
  title: string;
  locations: {
    id: string;
    latitude: number;
    longitude: number;
    autoCollect: boolean;
    _count: { consumers: number };
    consumers: {
      user: {
        name: string | null;
        id: string;
        email: string | null;
      };
    }[];
  }[];
};

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
  | "view attachment"
  | "transaction history"
  | "buy modal"
  | "my asset info modal"
  | "song buy modal"
  | "creator asset info"
  | "view admin asset"
  | "pin info modal";

export interface ModalData {
  pinId?: string;
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
  transaction?: Transaction;
  startDate?: Date;
  endDate?: Date;
  pinCollectionLimit?: number;
  pinRemainingLimit?: number;
  multiPin?: boolean;
  pinNumber?: number;
  autoCollect?: boolean;
  subscriptionId?: number;
  assetId?: number;
  link?: string;
  pageAsset?: boolean;
  privacy?: ItemPrivacy;
  Asset?: MarketAssetType;
  MyAsset?: AssetType;
  Song?: SongItemType;
  creatorStoreAsset?: MarketAssetType;
  adminAssetNtag?: AdminAssetWithTag;
  collectedPinInfo?: collectedPinInfoType;
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
