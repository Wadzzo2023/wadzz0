import { z } from "zod";
import { accountDetailsWithHomeDomain } from "~/lib/stellar/marketplace/test/acc";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { AssetSelectAllProperty } from "../marketplace/marketplace";

export const accRouter = createTRPCRouter({
  getAccountInfo: protectedProcedure.query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    const assets = await accountDetailsWithHomeDomain({ userPub: userId });

    const dbAssets = await ctx.db.asset.findMany({
      where: {
        OR: assets.map((asset) => ({
          code: asset.code,
          issuer: asset.issuer,
        })),
      },
      select: AssetSelectAllProperty,
    });

    const otherAssets = assets.filter((asset) => {
      return !dbAssets.some((dbAsset) => {
        return dbAsset.code === asset.code && dbAsset.issuer === asset.issuer;
      });
    });

    return dbAssets;
  }),

  getCreatorStorageInfo: protectedProcedure.query(async ({ ctx, input }) => {
    const creatorId = ctx.session.user.id;
    const storage = await ctx.db.creator.findUnique({
      where: { id: creatorId },
      select: { storagePub: true, storageSecret: true },
    });
    if (!storage?.storagePub) {
      throw new Error("storage does not exist");
    }

    const assets = await accountDetailsWithHomeDomain({
      userPub: storage.storagePub,
    });

    const dbAssets = await ctx.db.asset.findMany({
      where: {
        OR: assets.map((asset) => ({
          code: asset.code,
          issuer: asset.issuer,
        })),
      },
      select: AssetSelectAllProperty,
    });

    return dbAssets;
  }),
});
