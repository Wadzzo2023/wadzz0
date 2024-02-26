import { z } from "zod";

export type Album = {
  id: string;
  name: string;
  description: string;
  songs?: string[];
  coverImgUrl: string;
  order?: string[];
};
export type Song = {
  albumId: string;
  id: string;
  serialNumber: number;
  name: string;
  artist: string;
  coverImgUrl: string;
  musicUrl: string;
  duration: string;
  views: number;
  date: Date | JsonDate;
  privacy: SongPrivacy;
  songAsset?: SongAsset;
};

export const ZodSongAsset = z
  .object({
    price: z.string(),
    limit: z.string(),
    description: z.string(),
    code: z.string(),
    issuer: z.object({ pub: z.string(), secret: z.string() }),
    distributor: z.string(),
    ipfs: z.string(),
  })
  .optional();
export type SongAsset = z.infer<typeof ZodSongAsset>;

export enum SongPrivacy {
  DRAFT = "DRAFT",
  PUBLIC = "PUBLIC",
  RESTRICTED = "RESTRICTED",
}

export type JsonDate = {
  seconds: number;
  nanoseconds: number;
};

export type Asset = {
  asset_code: string;
  asset_issuer: string;
};
