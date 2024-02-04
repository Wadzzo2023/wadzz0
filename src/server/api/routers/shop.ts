import { z } from "zod";
import { ShopItemSchema } from "~/components/creator/add-shop-item";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const shopRouter = createTRPCRouter({
  createShopAsset: protectedProcedure
    .input(ShopItemSchema)
    .mutation(async ({ ctx, input }) => {
      const asset = await ctx.db.asset.create({
        data: {
          code: input.AssetName,
          issuer: input.issuer.publicKey,
          issuerPrivate: input.issuer.secretKey,
          creatorId: ctx.session.user.id,
        },
      });
      await ctx.db.shopAsset.create({
        data: {
          name: input.name,
          price: input.price,
          description: input.description,
          creatorId: ctx.session.user.id,
          mediaUrl: input.mediaUrl,
          thumbnail: "test",
          assetId: asset.id,
        },
      });
    }),

  getAllShopAsset: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.shopAsset.findMany({
      where: { creatorId: ctx.session.user.id },
      include: { asset: { select: { code: true, issuer: true } } },
    });
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
