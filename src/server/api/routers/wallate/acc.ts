import { z } from "zod";
import {
  accountBalances,
  accountDetailsWithHomeDomain,
  getAccountInfos,
} from "~/lib/stellar/marketplace/test/acc";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  adminProcedure,
  creatorProcedure,
} from "~/server/api/trpc";
import { AssetSelectAllProperty } from "../marketplace/marketplace";
import { get } from "http";

export const accRouter = createTRPCRouter({
  getAccountInfo: protectedProcedure.query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    const { tokens: assets } = await accountDetailsWithHomeDomain({
      userPub: userId,
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

    const accAssets = assets.filter((asset) => {
      return dbAssets.some((dbAsset) => {
        return dbAsset.code === asset.code && dbAsset.issuer === asset.issuer;
      });
    });

    return { dbAssets, accAssets, assets };
  }),

  getAccountBalance: protectedProcedure.query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    return await getAccountInfos(userId);
  }),

  getUserPubAssetBallances: protectedProcedure.query(async ({ ctx, input }) => {
    const pubkey = ctx.session.user.id;

    return await accountBalances({ userPub: pubkey });
  }),
  getCreatorStorageBallances: creatorProcedure.query(async ({ ctx, input }) => {
    const creator = ctx.session.user.id;

    const storage = await ctx.db.creator.findUniqueOrThrow({
      where: { id: creator },
      select: { storagePub: true },
    });

    return await accountBalances({ userPub: storage.storagePub });
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

    const { tokens: assets } = await accountDetailsWithHomeDomain({
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

    const accAssets = assets.filter((asset) => {
      return dbAssets.some((dbAsset) => {
        return dbAsset.code === asset.code && dbAsset.issuer === asset.issuer;
      });
    });

    return { dbAssets, accAssets, assets };
  }),

  getAStorageAssetInMarket: protectedProcedure
    .input(z.object({ code: z.string(), issuer: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return await ctx.db.marketAsset.findFirst({
        where: {
          placerId: userId,
          asset: { code: input.code, issuer: input.issuer },
        },
      });
    }),
});
