import { z } from "zod";
import {
  accountBalances,
  accountDetailsWithHomeDomain,
  getAccountInfos,
  getCreatorPageAssetBalance,
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

    const marketItems = dbAssets.length
      ? await ctx.db.marketAsset.findMany({
          where: {
            assetId: {
              in: dbAssets.map((asset) => asset.id),
            },
          },
          select: {
            assetId: true,
            price: true,
            priceUSD: true,
            placedAt: true,
          },
          orderBy: {
            placedAt: "desc",
          },
        })
      : [];

    const latestPriceMap = new Map<number, { price: number; priceUSD: number }>();
    for (const item of marketItems) {
      if (!latestPriceMap.has(item.assetId)) {
        latestPriceMap.set(item.assetId, {
          price: item.price,
          priceUSD: item.priceUSD,
        });
      }
    }

    const dbAssetsWithPrice = dbAssets.map((asset) => {
      const marketPrice = latestPriceMap.get(asset.id);
      return {
        ...asset,
        marketPrice: marketPrice?.price ?? null,
        marketPriceUSD: marketPrice?.priceUSD ?? null,
      };
    });

    return { dbAssets: dbAssetsWithPrice, accAssets, assets };
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
  getCreatorPageAssetBallances: creatorProcedure.query(async ({ ctx, input }) => {
    const creatorId = ctx.session.user.id;
    const storage = await ctx.db.creator.findUniqueOrThrow({
      where: { id: creatorId },
      include: {
        pageAsset: true,
      }


    });
    let assetCode = ""
    let assetIssuer = ""
    if (storage.pageAsset) {
      assetCode = storage.pageAsset.code
      assetIssuer = storage.pageAsset.issuer
    }
    else if (storage.customPageAssetCodeIssuer) {
      const [code, issuer] = storage.customPageAssetCodeIssuer.split(":");
      if (code && issuer) {
        assetCode = code;
        assetIssuer = issuer;
      }
    }
    return await getCreatorPageAssetBalance({
      pubkey: storage.storagePub,
      code: assetCode,
      issuer: assetIssuer,
    })

  }),
  getCreatorStorageBallancesByID: creatorProcedure.input(z.object({
    creatorId: z.string(),
  })).query(async ({ ctx, input }) => {
    const { creatorId } = input;

    const storage = await ctx.db.creator.findUniqueOrThrow({
      where: { id: creatorId },
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

    const marketItems = dbAssets.length
      ? await ctx.db.marketAsset.findMany({
          where: {
            assetId: {
              in: dbAssets.map((asset) => asset.id),
            },
          },
          select: {
            assetId: true,
            price: true,
            priceUSD: true,
            placedAt: true,
          },
          orderBy: {
            placedAt: "desc",
          },
        })
      : [];

    const latestPriceMap = new Map<number, { price: number; priceUSD: number }>();
    for (const item of marketItems) {
      if (!latestPriceMap.has(item.assetId)) {
        latestPriceMap.set(item.assetId, {
          price: item.price,
          priceUSD: item.priceUSD,
        });
      }
    }

    const dbAssetsWithPrice = dbAssets.map((asset) => {
      const marketPrice = latestPriceMap.get(asset.id);
      return {
        ...asset,
        marketPrice: marketPrice?.price ?? null,
        marketPriceUSD: marketPrice?.priceUSD ?? null,
      };
    });

    return { dbAssets: dbAssetsWithPrice, accAssets, assets };
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
