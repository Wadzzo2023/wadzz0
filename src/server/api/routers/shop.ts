import { z } from "zod";
import { ShopItemSchema } from "~/components/creator/add-shop-item";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const shopRouter = createTRPCRouter({
  getAssetTrx: protectedProcedure.query(({ ctx }) => {
    return "you can now see this secret message!";
  }),

  createShopAsset: protectedProcedure
    .input(ShopItemSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.shopAsset.create({
        data: {
          code: input.AssetName,
          name: input.name,
          price: input.price,
          description: input.description,
          creatorId: ctx.session.user.id,
          mediaUrl: input.mediaUrl,
          thumbnail: "test",
          issuer: "test",
        },
      });
    }),

  getAllShopAsset: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.shopAsset.findMany({
      where: { creatorId: ctx.session.user.id },
    });
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
