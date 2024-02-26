import { z } from "zod";

export type Album = {
  id: string;
  name: string;
  description: string;
  songs?: string[];
  coverImgUrl: string;
  order?: string[];
};
export type NFT = {
  copies: number;
  original: boolean;
  ownerAcc?: string; //  original has not need ownerAcc. its owner would be storage
  id: string;
  description: string;
  type: NFTType;
  name: string;
  thumbnailUrl: string;
  mediaUrl: string;
  views: number;
  date: Date | JsonDate;
  privacy: NFTPrivacy;
  nftAsset: NFTAsset;
  price: string;
};

export const ZodNFTIssuer = z.object({
  code: z.string(),
  pub: z.string(),
  secret: z.string(),
});

export type NFTIssuerPrivateInfo = z.infer<typeof ZodNFTIssuer>;

export const ZodNFTAsset = z.object({
  limit: z.string(),
  code: z.string(),
  issuer: z.object({ pub: z.string() }),
  distributor: z.string(),
  ipfs: z.string(),
});

export type NFTAsset = z.infer<typeof ZodNFTAsset>;

export enum NFTPrivacy {
  FOR_SALE = "For Sale",
  NOT_FOR_SALE = "Not for Sale (Public)",
  FIND = "Find in Wadzzo",
}
export enum NFTType {
  VIDEO = "VIDEO", // mp4
  MUSIC = "MUSIC", // mp3
  IMAGE = "IMAGE", // image formate (png, jpeg, webm)
  GIF = "GIF", // gif
}

export type JsonDate = {
  seconds: number;
  nanoseconds: number;
};

export type Asset = {
  asset_code: string;
  asset_issuer: string;
};
